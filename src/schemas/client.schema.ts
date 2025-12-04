import { z } from "zod";

const phoneRegex = /^[0-9()+\s-]{8,20}$/;

export const ClientBaseSchema = z.object({
  nome: z.string().min(3, "Nome precisa de pelo menos 3 caracteres"),
  fone: z
    .string()
    .regex(phoneRegex, "Informe um telefone válido")
    .transform((value) => value.trim()),
  vencimento: z
    .number()
    .int("Use um número inteiro")
    .min(1, "Dia mínimo é 1")
    .max(31, "Dia máximo é 31"),
  valor: z
    .number()
    .nonnegative("Valor não pode ser negativo"),
  observacoes: z
    .string()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .nullable(),
  ativo: z.boolean().optional().default(true),
});

export const CreateClientSchema = ClientBaseSchema;

export const UpdateClientSchema = ClientBaseSchema.partial().refine(
  (values) => Object.keys(values).length > 0,
  {
    message: "Informe ao menos um campo para atualizar",
  }
);

export const ClientIdSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

