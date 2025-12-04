import { prisma } from "@/lib/db";
import { CobrancaService } from "./cobranca.service";
import { Prisma } from "@prisma/client";
import { Status } from "@/generated/prisma/enums";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

export type DashboardStats = {
    activeClients: number;
    totalClients: number;
    pendingAmount: number;
    paidThisMonth: number;
    overdueAmount: number;
    clientsWithoutCharges: number;
    chargesDueSoon: number;
    overdueCount: number;
};

export const DashboardService = {
    async getStats(userId: string): Promise<DashboardStats> {
        await CobrancaService.syncStatusByDueDate(userId);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        );
        const nextSevenDays = new Date(now);
        nextSevenDays.setDate(now.getDate() + 7);

        const [
            totalClients,
            activeClients,
            pendingAmountAgg,
            paidThisMonthAgg,
            overdueAmountAgg,
            clientsWithoutCharges,
            chargesDueSoon,
            overdueCount,
        ] = await Promise.all([
            prisma.client.count({ where: { userId } }),
            prisma.client.count({ where: { userId, ativo: true } }),
            prisma.cobranca.aggregate({
                _sum: { valorDivida: true },
                where: {
                    client: { userId },
                    status: {
                        in: [
                            Status.PENDENTE,
                            Status.ATRASADO,
                        ],
                    },
                },
            }),
            prisma.cobranca.aggregate({
                _sum: { valorPago: true },
                where: {
                    client: { userId },
                    status: Status.PAGO,
                    dataPagamento: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            }),
            prisma.cobranca.aggregate({
                _sum: { valorDivida: true },
                where: {
                    client: { userId },
                    status: Status.ATRASADO,
                },
            }),
            prisma.client.count({
                where: {
                    userId,
                    cobrancas: { none: {} },
                },
            }),
            prisma.cobranca.count({
                where: {
                    client: { userId },
                    status: Status.PENDENTE,
                    dataVencimento: {
                        gte: now,
                        lte: nextSevenDays,
                    },
                },
            }),
            prisma.cobranca.count({
                where: {
                    client: { userId },
                    status: Status.ATRASADO,
                },
            }),
        ]);

        return {
            activeClients,
            totalClients,
            pendingAmount: pendingAmountAgg._sum.valorDivida || 0,
            paidThisMonth: paidThisMonthAgg._sum.valorPago || 0,
            overdueAmount: overdueAmountAgg._sum.valorDivida || 0,
            clientsWithoutCharges,
            chargesDueSoon,
            overdueCount,
        };
    },
    formatCurrency(value: number) {
        return currencyFormatter.format(value);
    },
};

