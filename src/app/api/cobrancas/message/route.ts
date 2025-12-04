import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserIdFromApiRequest } from "@/server/utils/api-auth";
import { CobrancaService } from "@/server/services/cobranca.service";
import { AppError } from "@/server/utils/errors";
import { UpdateMessageAttemptsSchema } from "@/schemas/cobranca.schema";

const BodySchema = z
    .object({
        id: z
            .string("ID da cobrança é obrigatório")
            .min(1, "ID da cobrança não pode estar vazio")
            .transform((val) => val.trim())
            .pipe(z.string().uuid("ID da cobrança inválido. Deve ser um UUID válido (ex: 123e4567-e89b-12d3-a456-426614174000)")),
    })
    .and(UpdateMessageAttemptsSchema);

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromApiRequest(request);
        const json = await request.json();

        // Log para debug - remover em produção se necessário
        console.log("[Cobrancas Message] Body recebido:", JSON.stringify(json, null, 2));
        console.log("[Cobrancas Message] Tipo do id:", typeof json.id, "Valor:", json.id);

        const parsed = BodySchema.parse(json);

        const { id, ...payload } = parsed;

        const cobranca = await CobrancaService.updateMessageAttempts(
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

        if (error instanceof z.ZodError) {
            const errors = error.issues.map((err) => {
                const fieldPath = err.path.join(".");
                const receivedValue = err.path.length > 0 ? (error as any).input?.[err.path[0]] : undefined;

                // Mensagem mais específica para erro de UUID
                let message = err.message;
                if (fieldPath === "id" && receivedValue) {
                    message = `ID da cobrança inválido. Recebido: "${receivedValue}" (${receivedValue.length} caracteres). Esperado: UUID no formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. Verifique se está usando o campo 'id' correto da resposta de /api/integrations/cobrancas, não 'client.id' ou outro campo.`;
                }

                return {
                    field: fieldPath,
                    message,
                    receivedValue,
                    receivedType: typeof receivedValue,
                };
            });

            // Log detalhado para debug
            console.error("[Cobrancas Message] Erro de validação Zod:", {
                errors: error.issues,
                input: (error as any).input,
            });

            return NextResponse.json(
                {
                    message: "Erro de validação",
                    errors,
                },
                { status: 400 }
            );
        }

        console.error("[Cobrancas Message] Erro inesperado", error);
        return NextResponse.json(
            { message: "Erro interno inesperado" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";


