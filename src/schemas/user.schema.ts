import { z } from "zod";
import { Role } from "@/generated/prisma/enums";

export const CreateUserSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome precisa de pelo menos 3 caracteres")
    .transform((value) => value.trim()),
  email: z
    .string()
    .email("Informe um e-mail válido")
    .transform((value) => value.toLowerCase().trim()),
  password: z
    .string()
    .min(6, "Senha precisa de pelo menos 6 caracteres"),
  role: z.nativeEnum(Role).default(Role.USER),
  isActive: z.boolean().optional().default(true),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;


