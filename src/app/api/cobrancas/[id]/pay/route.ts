import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { CobrancaService } from "@/server/services/cobranca.service";
import { AppError } from "@/server/utils/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    
    const valor = body.valor;
    const dataPagamento = body.dataPagamento;

    const cobranca = await CobrancaService.markAsPaid(
      session.user.id,
      id,
      valor,
      dataPagamento
    );

    // Revalida a página de cobranças para refletir as mudanças
    revalidatePath("/cobrancas");
    revalidatePath(`/cobrancas/${id}`);

    return NextResponse.json(cobranca);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    console.error("[API] Erro ao efetivar pagamento", error);
    return NextResponse.json(
      { message: "Erro interno inesperado" },
      { status: 500 }
    );
  }
}

