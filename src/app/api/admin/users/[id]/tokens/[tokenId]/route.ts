import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/utils/admin-auth";
import { ApiTokenController } from "@/server/controllers/api-token.controller";
import { AppError } from "@/server/utils/errors";

type RouteContext = {
  params: Promise<{ id: string; tokenId: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    await requireAdminSession();
    const { tokenId } = await params;

    await ApiTokenController.revokeToken(tokenId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }
    console.error("[Admin] Erro ao revogar token", error);
    return NextResponse.json(
      { message: "Erro interno inesperado" },
      { status: 500 }
    );
  }
}

