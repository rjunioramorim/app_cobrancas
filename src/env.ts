import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL é obrigatória")
    .refine(
      (url) => url.startsWith("postgresql://") || url.startsWith("postgres://"),
      {
        message: "DATABASE_URL deve começar com 'postgresql://' ou 'postgres://'",
      }
    ),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET é obrigatório"),
  NEXTAUTH_URL: z.string().url().optional(),
});

// Detecta se estamos em build time do Next.js
// Durante o build, as variáveis de ambiente podem não estar disponíveis
const isBuildTime = 
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-production-compile' ||
  (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && typeof window === 'undefined');

let cachedEnv: z.infer<typeof envSchema> | null = null;

function getEnv() {
  // Se já validou antes, retorna o cache
  if (cachedEnv) {
    return cachedEnv;
  }

  // Durante o build, retorna valores padrão sem validar
  // Isso permite que o build complete mesmo sem as variáveis
  if (isBuildTime) {
    return {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://placeholder',
      AUTH_SECRET: process.env.AUTH_SECRET || 'placeholder',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    } as z.infer<typeof envSchema>;
  }

  // Em runtime, valida normalmente
  try {
    cachedEnv = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    });
  } catch (error) {
    // Se falhar a validação em runtime, relança o erro
    throw error;
  }

  return cachedEnv;
}

export const env = getEnv();

