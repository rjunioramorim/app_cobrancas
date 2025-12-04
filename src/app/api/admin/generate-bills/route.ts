import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/utils/admin-auth";
import { generateMonthlyBills } from "@/server/services/billing-scheduler.service";
import { AppError } from "@/server/utils/errors";

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    const body = await request.json().catch(() => ({}));
    const { month, year, userId } = body;

    // Se não fornecido, usa o próximo mês
    let targetMonth: number;
    let targetYear: number;

    if (month && year) {
      targetMonth = Number(month);
      targetYear = Number(year);

      if (
        !Number.isInteger(targetMonth) ||
        targetMonth < 1 ||
        targetMonth > 12
      ) {
        return NextResponse.json(
          { message: "Mês inválido. Deve ser entre 1 e 12" },
          { status: 400 }
        );
      }

      if (!Number.isInteger(targetYear) || targetYear < 2000) {
        return NextResponse.json(
          { message: "Ano inválido" },
          { status: 400 }
        );
      }
    } else {
      // Calcula o próximo mês
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      targetMonth = nextMonth.getMonth() + 1; // 1-12
      targetYear = nextMonth.getFullYear();
    }

    // Se userId fornecido, valida se existe
    if (userId) {
      const { prisma } = await import("@/lib/db");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, nome: true, email: true },
      });

      if (!user) {
        return NextResponse.json(
          { message: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      console.log(
        `[Admin API] Geração manual de cobranças solicitada para usuário ${user.nome} (${userId}) - ${targetMonth}/${targetYear}`
      );

      const result = await generateMonthlyBills(targetMonth, targetYear, userId);

      return NextResponse.json({
        success: true,
        message: `Geração concluída para ${user.nome}: ${result.created} cobranças criadas`,
        result: {
          total: result.total,
          created: result.created,
          duplicates: result.duplicates,
          errors: result.errors,
          errorDetails: result.errorDetails,
        },
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
        },
        targetMonth,
        targetYear,
      });
    }

    console.log(
      `[Admin API] Geração manual de cobranças solicitada para todos os usuários - ${targetMonth}/${targetYear}`
    );

    const result = await generateMonthlyBills(targetMonth, targetYear);

    return NextResponse.json({
      success: true,
      message: `Geração concluída: ${result.created} cobranças criadas`,
      result: {
        total: result.total,
        created: result.created,
        duplicates: result.duplicates,
        errors: result.errors,
        errorDetails: result.errorDetails,
      },
      targetMonth,
      targetYear,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    console.error("[Admin API] Erro ao gerar cobranças:", error);
    return NextResponse.json(
      { message: "Erro interno ao gerar cobranças" },
      { status: 500 }
    );
  }
}

