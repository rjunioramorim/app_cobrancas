import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors";
import type {
  CreateCobrancaInput,
  UpdateCobrancaInput,
  UpdateCobrancaIntegrationInput,
  UpdateMessageAttemptsInput,
} from "@/schemas/cobranca.schema";
import { Status } from "@/generated/prisma/client";

export const CobrancaService = {
  async syncStatusByDueDate(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.cobranca.updateMany({
      where: {
        client: { userId },
        status: Status.PENDENTE,
        dataVencimento: {
          lt: today,
        },
      },
      data: {
        status: Status.ATRASADO,
      },
    });

    await prisma.cobranca.updateMany({
      where: {
        client: { userId },
        status: Status.ATRASADO,
        dataVencimento: {
          gte: today,
        },
      },
      data: {
        status: Status.PENDENTE,
      },
    });
  },

  async list(
    userId: string,
    filters?: { startDate?: Date; endDate?: Date; status?: string; clientName?: string }
  ) {
    await this.syncStatusByDueDate(userId);

    const where: any = {
      client: {
        userId,
      },
    };

    if (filters?.startDate || filters?.endDate) {
      where.dataVencimento = {};
      if (filters.startDate) {
        where.dataVencimento.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.dataVencimento.lte = filters.endDate;
      }
    }

    if (filters?.status && filters.status !== "todos") {
      where.status = filters.status;
    }

    if (filters?.clientName) {
      where.client = {
        ...where.client,
        nome: {
          contains: filters.clientName,
          mode: "insensitive",
        },
      };
    }

    return prisma.cobranca.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            fone: true,
          },
        },
      },
      orderBy: { dataVencimento: "desc" },
    });
  },

  async findById(userId: string, id: string) {
    const cobranca = await prisma.cobranca.findFirst({
      where: {
        id,
        client: {
          userId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            fone: true,
            valor: true,
            vencimento: true,
          },
        },
      },
    });

    if (!cobranca) {
      throw new AppError("Cobrança não encontrada", 404);
    }

    return cobranca;
  },

  async create(userId: string, data: CreateCobrancaInput) {
    await this.ensureClientBelongsToUser(data.clientId, userId);

    return prisma.cobranca.create({
      data: {
        clientId: data.clientId,
        valor: data.valor,
        valorDivida: data.valor, // Valor original da dívida
        valorPago: null, // Ainda não foi pago
        vencimento: data.dataVencimento,
        dataVencimento: data.dataVencimento,
        dataPagamento: data.dataPagamento || null,
        status: (data.status as Status) ?? Status.PENDENTE,
        observacoes: data.observacoes?.trim() || null,
      },
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            fone: true,
          },
        },
      },
    });
  },

  async update(userId: string, id: string, data: UpdateCobrancaInput) {
    const cobranca = await this.findById(userId, id);

    if (data.clientId) {
      await this.ensureClientBelongsToUser(data.clientId, userId);
    }

    // Se o valor está sendo alterado e a cobrança ainda não foi paga, atualiza valorDivida
    const updateData: any = {
      clientId: data.clientId,
      valor: data.valor,
      vencimento: data.dataVencimento,
      dataVencimento: data.dataVencimento,
      dataPagamento: data.dataPagamento === undefined ? undefined : data.dataPagamento || null,
      status: data.status ? (data.status as Status) : undefined,
      observacoes:
        data.observacoes === undefined
          ? undefined
          : data.observacoes?.trim() || null,
    };

    // Se está alterando o valor e ainda não foi pago, atualiza valorDivida
    if (data.valor !== undefined && cobranca.status !== Status.PAGO) {
      updateData.valorDivida = data.valor;
    }

    return prisma.cobranca.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            fone: true,
          },
        },
      },
    });
  },

  async markAsPaid(
    userId: string,
    id: string,
    valor?: number,
    dataPagamento?: string
  ) {
    const cobranca = await this.findById(userId, id);

    if (cobranca.status === Status.PAGO) {
      throw new AppError("Cobrança já está marcada como paga", 400);
    }

    if (cobranca.status === Status.CANCELADO) {
      throw new AppError("Não é possível marcar uma cobrança cancelada como paga", 400);
    }

    // Usar valor fornecido ou usar o valor da dívida
    const valorPagoFinal = valor !== undefined ? valor : cobranca.valorDivida;

    // Usar data fornecida ou usar data atual
    const dataPagamentoFinal = dataPagamento
      ? new Date(dataPagamento)
      : new Date();

    return prisma.cobranca.update({
      where: { id },
      data: {
        status: Status.PAGO,
        dataPagamento: dataPagamentoFinal,
        valorPago: valorPagoFinal,
        // Atualiza o valor exibido com o valor pago
        valor: valorPagoFinal,
      },
      include: {
        client: {
          select: {
            id: true,
            nome: true,
            fone: true,
          },
        },
      },
    });
  },

  async updateFromIntegration(
    userId: string,
    id: string,
    data: UpdateCobrancaIntegrationInput
  ) {
    const cobranca = await this.findById(userId, id);
    const updates: {
      messageAttempts?: number;
      observacoes?: string | null;
    } = {};
    let hasChanges = false;

    if (data.messageAttemptsDelta !== undefined) {
      const newAttempts = cobranca.messageAttempts + data.messageAttemptsDelta;

      if (newAttempts > 3) {
        throw new AppError("Limite de tentativas atingido", 400);
      }

      updates.messageAttempts = newAttempts;
      hasChanges = true;
    }

    if (data.observacoes) {
      const trimmed = data.observacoes.trim();
      if (trimmed.length > 0) {
        updates.observacoes =
          data.appendObservacoes && cobranca.observacoes
            ? `${cobranca.observacoes}\n${trimmed}`.trim()
            : trimmed;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      throw new AppError("Nenhum campo válido enviado", 400);
    }

    const updated = await prisma.cobranca.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        status: true,
        messageAttempts: true,
        observacoes: true,
      },
    });

    return updated;
  },

  async updateMessageAttempts(
    userId: string,
    id: string,
    data: UpdateMessageAttemptsInput
  ) {
    return this.updateFromIntegration(userId, id, {
      messageAttemptsDelta: 1,
      observacoes: data.observacoes,
      appendObservacoes: data.appendObservacoes,
    });
  },

  async ensureClientBelongsToUser(clientId: string, userId: string) {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!client) {
      throw new AppError("Cliente não encontrado ou não pertence ao usuário", 404);
    }
  },

  async checkDuplicateByDueDate(clientId: string, dataVencimento: Date): Promise<boolean> {
    // Normaliza a data para comparar apenas dia/mês/ano (ignora hora)
    const startOfDay = new Date(dataVencimento);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dataVencimento);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.cobranca.findFirst({
      where: {
        clientId,
        dataVencimento: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return !!existing;
  },
};

