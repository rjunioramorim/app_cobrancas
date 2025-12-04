import { NextResponse } from "next/server";
import { CobrancaController } from "@/server/controllers/cobranca.controller";
import { handleApiError, requireUserId } from "./_helpers";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    
    const month = searchParams.get("month");
    const filters: { startDate?: Date; endDate?: Date } = {};

    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      filters.startDate = startDate;
      filters.endDate = endDate;
    } else {
      // Padrão: do início do mês até hoje
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const cobrancas = await CobrancaController.list(userId, filters);
    return NextResponse.json(cobrancas);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const cobranca = await CobrancaController.create(userId, body);
    return NextResponse.json(cobranca, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

