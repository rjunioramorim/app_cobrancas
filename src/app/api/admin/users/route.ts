import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/utils/admin-auth";
import { ApiTokenController } from "@/server/controllers/api-token.controller";
import { AppError } from "@/server/utils/errors";
import { UserController } from "@/server/controllers/user.controller";

const MAX_LIMIT = 50;

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(
      Number(searchParams.get("limit")) || 20,
      MAX_LIMIT
    );
    const cursor = searchParams.get("cursor") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await ApiTokenController.listUsers({
      search,
      cursor,
      limit,
    });

    return NextResponse.json({
      data: result.users.map((user) => ({
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        tokens: user.tokens,
      })),
      pagination: {
        limit,
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("[Admin] Erro ao listar usuários", error);
    return NextResponse.json(
      { message: "Erro interno inesperado" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const user = await UserController.create(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("[Admin] Erro ao criar usuário", error);
    return NextResponse.json(
      { message: "Erro interno inesperado" },
      { status: 500 }
    );
  }
}


