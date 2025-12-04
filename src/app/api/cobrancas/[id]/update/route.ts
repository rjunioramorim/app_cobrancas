import { NextResponse } from "next/server";
import { getUserIdFromApiRequest } from "@/server/utils/api-auth";
import { CobrancaService } from "@/server/services/cobranca.service";
import { AppError } from "@/server/utils/errors";
import { UpdateCobrancaIntegrationSchema } from "@/schemas/cobranca.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const userId = await getUserIdFromApiRequest(request);
    const { id } = await params;
    const body = await request.json();
    const payload = UpdateCobrancaIntegrationSchema.parse(body);

    const cobranca = await CobrancaService.updateFromIntegration(
      userId,
      id,
      payload
    );

    return NextResponse.json({ data: cobranca });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    console.error("[Cobrancas Integration] Erro inesperado", error);
    return NextResponse.json(
      { message: "Erro interno inesperado" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

