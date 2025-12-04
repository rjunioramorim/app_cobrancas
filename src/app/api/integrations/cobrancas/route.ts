import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromApiRequest } from "@/server/utils/api-auth";
import { AppError } from "@/server/utils/errors";
import { CobrancaService } from "@/server/services/cobranca.service";

const MAX_LIMIT = 50;

const STATUS_OVERDUE: Array<"ATRASADO"> = ["ATRASADO"];

const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const endOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromApiRequest(request);
        const { searchParams } = new URL(request.url);

        const limit = Math.min(
            Number(searchParams.get("limit")) || MAX_LIMIT,
            MAX_LIMIT
        );
        const cursor = searchParams.get("cursor");

        await CobrancaService.syncStatusByDueDate(userId);

        // Bloqueia clientes com 3 ou mais tentativas em cobranças não pagas
        const clientsToBlock = await prisma.cobranca.findMany({
            where: {
                client: {
                    userId,
                    ativo: true,
                },
                messageAttempts: {
                    gte: 3,
                },
                status: {
                    not: "PAGO",
                },
            },
            select: {
                clientId: true,
            },
            distinct: ["clientId"],
        });

        if (clientsToBlock.length > 0) {
            await prisma.client.updateMany({
                where: {
                    id: {
                        in: clientsToBlock.map((c) => c.clientId),
                    },
                },
                data: {
                    ativo: false,
                },
            });
        }

        const today = startOfDay(new Date());
        const inTwoDays = new Date(today);
        inTwoDays.setDate(inTwoDays.getDate() + 2);
        const upcomingStart = today;
        const upcomingEnd = endOfDay(inTwoDays);

        const where = {
            messageAttempts: {
                lt: 3,
            },
            OR: [
                {
                    status: "PENDENTE" as const,
                    dataVencimento: {
                        gte: upcomingStart,
                        lte: upcomingEnd,
                    },
                    client: {
                        userId,
                        ativo: true,
                    },
                },
                {
                    status: {
                        in: STATUS_OVERDUE,
                    },
                    client: {
                        userId,
                        ativo: true,
                    },
                },
            ],
        };

        const cobrancas = await prisma.cobranca.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        nome: true,
                        fone: true,
                        ativo: true,
                    },
                },
            },
            orderBy: [
                { dataVencimento: "asc" },
                { id: "asc" },
            ],
            take: limit + 1,
            ...(cursor
                ? {
                    cursor: { id: cursor },
                    skip: 1,
                }
                : {}),
        });
        const hasNextPage = cobrancas.length > limit;

        if (hasNextPage) {
            cobrancas.pop();
        }

        const data = cobrancas.map((cobranca) => {
            // Log para debug - garantir que estamos retornando UUID válido
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cobranca.id)) {
                console.warn(`[Integrations] ID inválido detectado: ${cobranca.id} (tipo: ${typeof cobranca.id})`);
            }
            return {
                id: cobranca.id,
                client: cobranca.client,
                status: cobranca.status,
                valor: cobranca.valor,
                dataVencimento: cobranca.dataVencimento,
                messageAttempts: cobranca.messageAttempts,
                observacoes: cobranca.observacoes,
                category:
                    cobranca.status === "PENDENTE" ? "upcoming" : ("overdue" as const),
            };
        });

        return NextResponse.json({
            data,
            pagination: {
                limit,
                nextCursor: hasNextPage ? cobrancas[cobrancas.length - 1]?.id ?? null : null,
                hasNextPage,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { message: error.message },
                { status: error.status }
            );
        }

        console.error("[Integrations] Erro ao listar cobranças", error);
        return NextResponse.json(
            { message: "Erro interno inesperado" },
            { status: 500 }
        );
    }
}

