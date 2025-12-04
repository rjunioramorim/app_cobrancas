import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserSecurityController } from "@/server/controllers/user-security.controller";
import { AppError } from "@/server/utils/errors";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    await UserSecurityController.changePassword(session.user.id, body);

    return NextResponse.json(
      { message: "Senha alterada com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    console.error("[Auth] Erro ao alterar senha", error);
    return NextResponse.json(
      { message: "Erro interno inesperado" },
      { status: 500 }
    );
  }
}


