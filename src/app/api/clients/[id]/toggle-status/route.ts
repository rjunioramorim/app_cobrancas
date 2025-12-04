import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ClientService } from "@/server/services/client.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { ativo } = body;

    if (typeof ativo !== "boolean") {
      return NextResponse.json(
        { message: "Campo 'ativo' deve ser um booleano" },
        { status: 400 }
      );
    }

    await ClientService.update(session.user.id, id, { ativo });

    return NextResponse.json(
      { success: true, message: ativo ? "Cliente ativado com sucesso" : "Cliente desativado com sucesso" },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("não encontrado")) {
        return NextResponse.json(
          { message: error.message },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

