import { z } from "zod";

export const CreateApiTokenSchema = z.object({
  name: z.string().min(3, "Nome precisa de pelo menos 3 caracteres"),
  expiresAt: z
    .preprocess(
      (value) => (typeof value === "string" && value ? new Date(value) : value),
      z.date().optional().nullable()
    )
    .refine(
      (date) => !date || date > new Date(),
      "Data de expiração deve ser futura"
    )
    .optional()
    .nullable(),
});

export type CreateApiTokenInput = z.infer<typeof CreateApiTokenSchema>;

