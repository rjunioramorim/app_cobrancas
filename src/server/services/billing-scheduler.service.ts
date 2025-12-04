import { prisma } from "@/lib/db";
import { Status } from "@/generated/prisma/client";
import { CobrancaService } from "./cobranca.service";

export type BillingGenerationResult = {
  total: number;
  created: number;
  duplicates: number;
  errors: number;
  errorDetails: Array<{ clientId: string; clientName: string; error: string }>;
};

/**
 * Calcula a data de vencimento no mês e ano especificados
 * Trata casos especiais onde o dia de vencimento não existe no mês (ex: 31 em fevereiro)
 */
export function calculateDueDate(
  vencimento: number,
  targetMonth: number,
  targetYear: number
): Date {
  // Obtém o último dia do mês alvo
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  
  // Se o dia de vencimento é maior que o último dia do mês, usa o último dia
  const day = Math.min(vencimento, lastDay);
  
  // Cria a data (targetMonth é 1-indexed no Date, então subtrai 1)
  return new Date(targetYear, targetMonth - 1, day);
}

/**
 * Gera cobranças mensais para todos os clientes ativos
 * @param targetMonth Mês alvo (1-12)
 * @param targetYear Ano alvo
 * @param userId Opcional: ID do usuário para gerar cobranças apenas para seus clientes
 * @returns Estatísticas da geração
 */
export async function generateMonthlyBills(
  targetMonth: number,
  targetYear: number,
  userId?: string
): Promise<BillingGenerationResult> {
  const result: BillingGenerationResult = {
    total: 0,
    created: 0,
    duplicates: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    // Busca todos os clientes ativos (filtrado por userId se fornecido)
    const activeClients = await prisma.client.findMany({
      where: {
        ativo: true,
        ...(userId && { userId }),
      },
      select: {
        id: true,
        userId: true,
        nome: true,
        vencimento: true,
        valor: true,
      },
    });

    result.total = activeClients.length;

    // Processa cada cliente
    for (const client of activeClients) {
      try {
        // Calcula a data de vencimento
        const dataVencimento = calculateDueDate(
          client.vencimento,
          targetMonth,
          targetYear
        );

        // Verifica se já existe cobrança com essa data de vencimento
        const isDuplicate = await CobrancaService.checkDuplicateByDueDate(
          client.id,
          dataVencimento
        );

        if (isDuplicate) {
          result.duplicates++;
          console.log(
            `[BillingScheduler] Cobrança duplicada ignorada: Cliente ${client.nome} (${client.id}) - Data: ${dataVencimento.toISOString().split('T')[0]}`
          );
          continue;
        }

        // Valida se o valor é válido
        if (!client.valor || client.valor <= 0) {
          result.errors++;
          result.errorDetails.push({
            clientId: client.id,
            clientName: client.nome,
            error: "Valor inválido ou zero",
          });
          console.error(
            `[BillingScheduler] Erro: Cliente ${client.nome} tem valor inválido: ${client.valor}`
          );
          continue;
        }

        // Cria a cobrança
        await prisma.cobranca.create({
          data: {
            clientId: client.id,
            valor: client.valor,
            valorDivida: client.valor,
            valorPago: null,
            vencimento: dataVencimento,
            dataVencimento: dataVencimento,
            dataPagamento: null,
            status: Status.PENDENTE,
            observacoes: `Cobrança gerada automaticamente para ${targetMonth}/${targetYear}`,
            messageAttempts: 0,
          },
        });

        result.created++;
        console.log(
          `[BillingScheduler] Cobrança criada: Cliente ${client.nome} (${client.id}) - Valor: R$ ${client.valor.toFixed(2)} - Vencimento: ${dataVencimento.toISOString().split('T')[0]}`
        );
      } catch (error) {
        result.errors++;
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        result.errorDetails.push({
          clientId: client.id,
          clientName: client.nome,
          error: errorMessage,
        });
        console.error(
          `[BillingScheduler] Erro ao processar cliente ${client.nome} (${client.id}):`,
          error
        );
      }
    }

    console.log(
      `[BillingScheduler] Geração concluída: ${result.created} criadas, ${result.duplicates} duplicadas, ${result.errors} erros de ${result.total} clientes`
    );

    return result;
  } catch (error) {
    console.error("[BillingScheduler] Erro fatal na geração de cobranças:", error);
    throw error;
  }
}

