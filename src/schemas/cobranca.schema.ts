import { z } from "zod";

export const StatusEnum = z.enum([
  "PENDENTE",
  "PAGO",
  "CANCELADO",
]);

export const CobrancaBaseSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido"),
  valor: z
    .number()
    .positive("Valor deve ser maior que zero"),
  dataVencimento: z.coerce.date(),
  dataPagamento: z.coerce.date().optional().nullable(),
  status: StatusEnum.optional().default("PENDENTE"),
  observacoes: z
    .string()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .nullable(),
});

export const CreateCobrancaSchema = CobrancaBaseSchema;

export const UpdateCobrancaSchema = CobrancaBaseSchema.partial().refine(
  (values) => Object.keys(values).length > 0,
  {
    message: "Informe ao menos um campo para atualizar",
  }
);

export const UpdateCobrancaIntegrationSchema = z
  .object({
    messageAttemptsDelta: z
      .number()
      .int("Informe um número inteiro para as tentativas")
      .min(1, "Incremento mínimo é 1")
      .max(3, "Incremento máximo é 3")
      .optional(),
    observacoes: z
      .string()
      .max(500, "Máximo de 500 caracteres")
      .optional(),
    appendObservacoes: z.boolean().optional().default(false),
  })
  .refine(
    (payload) =>
      payload.messageAttemptsDelta !== undefined ||
      (payload.observacoes !== undefined && payload.observacoes.trim().length > 0),
    {
      message: "Envie pelo menos messageAttemptsDelta ou observacoes",
      path: ["messageAttemptsDelta"],
    }
  );

export const UpdateMessageAttemptsSchema = z.object({
  observacoes: z
    .string()
    .max(500, "Máximo de 500 caracteres")
    .optional(),
  appendObservacoes: z
    .union([
      z.boolean(),
      z.string().transform((val) => {
        const lower = val.toLowerCase().trim();
        return lower === "true" || lower === "1" || lower === "yes";
      }),
    ])
    .optional()
    .default(false),
});

export const CobrancaIdSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export type CreateCobrancaInput = z.infer<typeof CreateCobrancaSchema>;
export type UpdateCobrancaInput = z.infer<typeof UpdateCobrancaSchema>;
export type UpdateCobrancaIntegrationInput = z.infer<
  typeof UpdateCobrancaIntegrationSchema
>;
export type UpdateMessageAttemptsInput = z.infer<
  typeof UpdateMessageAttemptsSchema
>;

