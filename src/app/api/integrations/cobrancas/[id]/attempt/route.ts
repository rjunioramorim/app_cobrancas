import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromApiRequest } from "@/server/utils/api-auth";
import { AppError } from "@/server/utils/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const userId = await getUserIdFromApiRequest(request);
    const { id } = await params;

    const cobranca = await prisma.cobranca.findFirst({
      where: {
        id,
        client: {
          userId,
        },
      },
      select: {
        id: true,
        messageAttempts: true,
        status: true,
      },
    });

    if (!cobranca) {
      throw new AppError("Cobrança não encontrada", 404);
    }

    if (cobranca.messageAttempts >= 3) {
      throw new AppError("Limite de tentativas atingido", 400);
    }

    const updated = await prisma.cobranca.update({
      where: { id: cobranca.id },
      data: {
        messageAttempts: {
          increment: 1,
        },
      },
      select: {
        id: true,
        messageAttempts: true,
      },
    });

    return NextResponse.json({
      data: updated,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    console.error("[Integrations] Erro ao registrar tentativa", error);
    return NextResponse.json(
      { message: "Erro interno inesperado" },
      { status: 500 }
    );
  }
}

