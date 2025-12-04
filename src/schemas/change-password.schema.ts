import { z } from "zod";

export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(6, "Nova senha precisa de pelo menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(6, "Confirmação de senha precisa de pelo menos 6 caracteres"),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "As senhas não conferem",
      path: ["confirmPassword"],
    }
  );

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;


