import { prisma } from "@/lib/db";
import { AppError } from "../utils/errors";
import type {
    CreateClientInput,
    UpdateClientInput,
} from "@/schemas/client.schema";

const normalizePhone = (value: string) => value.replace(/\D/g, "");

export const ClientService = {
    async list(
        userId: string,
        filters?: { search?: string; status?: "ativo" | "inativo" | "todos" }
    ) {
        const where: any = { userId };

        if (filters?.search) {
            where.nome = {
                contains: filters.search,
                mode: "insensitive",
            };
        }

        if (filters?.status && filters.status !== "todos") {
            where.ativo = filters.status === "ativo";
        }

        return prisma.client.findMany({
            where,
            orderBy: { nome: "asc" },
            select: {
                id: true,
                nome: true,
                fone: true,
                vencimento: true,
                valor: true,
                ativo: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    },

    async findById(userId: string, id: string) {
        const client = await prisma.client.findFirst({
            where: { id, userId },
            include: {
                cobrancas: {
                    orderBy: { dataVencimento: "desc" },
                    take: 5,
                },
            },
        });

        if (!client) {
            throw new AppError("Cliente não encontrado", 404);
        }

        return client;
    },

    async create(userId: string, data: CreateClientInput) {
        const normalizedPhone = normalizePhone(data.fone);
        await this.ensurePhoneIsUnique(normalizedPhone, userId);

        return prisma.client.create({
            data: {
                userId,
                nome: data.nome.trim(),
                fone: normalizedPhone,
                vencimento: data.vencimento,
                valor: data.valor,
                ativo: data.ativo ?? true,
                observacoes: data.observacoes?.trim() || null,
            },
        });
    },

    async update(userId: string, id: string, data: UpdateClientInput) {
        await this.findById(userId, id);

        let normalizedPhone: string | undefined;
        if (data.fone) {
            normalizedPhone = normalizePhone(data.fone);
            await this.ensurePhoneIsUnique(normalizedPhone, userId, id);
        }

        return prisma.client.update({
            where: { id },
            data: {
                nome: data.nome?.trim(),
                fone: normalizedPhone,
                vencimento: data.vencimento,
                valor: data.valor,
                ativo: data.ativo,
                observacoes:
                    data.observacoes === undefined
                        ? undefined
                        : data.observacoes?.trim() || null,
            },
        });
    },

    async ensurePhoneIsUnique(
        fone: string,
        userId: string,
        ignoreClientId?: string
    ) {
        const existing = await prisma.client.findFirst({
            where: {
                fone,
                userId,
                NOT: ignoreClientId ? { id: ignoreClientId } : undefined,
            },
        });

        if (existing) {
            throw new AppError("Telefone já cadastrado para outro cliente", 409);
        }
    },
};

