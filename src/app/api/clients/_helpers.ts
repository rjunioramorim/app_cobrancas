import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AppError } from "@/server/utils/errors";

export async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AppError("Não autenticado", 401);
  }

  return session.user.id;
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status }
    );
  }

  console.error("[Clients API] Erro inesperado", error);
  return NextResponse.json(
    { message: "Erro interno inesperado" },
    { status: 500 }
  );
}

