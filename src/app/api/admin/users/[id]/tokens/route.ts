import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/utils/admin-auth";
import { ApiTokenController } from "@/server/controllers/api-token.controller";
import { AppError } from "@/server/utils/errors";
import type { Prisma } from "@/generated/prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    await requireAdminSession();
    const { id } = await params;

    const tokens = await ApiTokenController.listTokens(id);
    return NextResponse.json({ data: tokens });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("[Admin] Erro ao listar tokens", error);
    return NextResponse.json(
      { message: "Erro interno inesperado" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = await request.json();

    const token = await ApiTokenController.createToken(id, body);
    return NextResponse.json(
      {
        data: {
          id: token.id,
          token: token.token,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("[Admin] Erro ao criar token", error);
    return NextResponse.json(
      { message: "Erro interno inesperado" },
      { status: 500 }
    );
  }
}

