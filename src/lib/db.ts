import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Função para criar uma nova instância do Prisma Client
function createPrismaClient() {
  // Valida se DATABASE_URL está configurada (só em runtime, não durante build)
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;
  
  if (!isBuildTime) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL não está configurada. Configure a variável de ambiente DATABASE_URL.'
      );
    }

    if (
      !process.env.DATABASE_URL.startsWith('postgresql://') &&
      !process.env.DATABASE_URL.startsWith('postgres://')
    ) {
      throw new Error(
        `DATABASE_URL inválida. Deve começar com 'postgresql://' ou 'postgres://'. Valor recebido: ${process.env.DATABASE_URL ? '***' : '(vazio)'}`
      );
    }
  }

  return new PrismaClient({
    log: ['error', 'warn'],
  });
}

// Verificar se já existe uma instância no global
let prismaInstance = globalForPrisma.prisma;

// Detecta se estamos em build time
const isBuildTime = 
  process.env.NEXT_PHASE === 'phase-production-build' ||
  (typeof window === 'undefined' && !process.env.DATABASE_URL && process.env.NODE_ENV === 'production');

// Só cria o Prisma Client se não estiver em build time
if (!isBuildTime) {
  // Se não existe ou se apiToken não está disponível, criar nova instância
  if (!prismaInstance || !prismaInstance.apiToken) {
    prismaInstance = createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  }
}

// Em build time, exporta um objeto vazio que será substituído em runtime
// Em runtime, exporta a instância real
export const prisma = prismaInstance || ({} as PrismaClient);

