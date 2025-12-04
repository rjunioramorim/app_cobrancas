import { PrismaClient } from '@/generated/prisma/client';
import '@/lib/cron-init'; // Inicializa cron jobs
import '@/env'; // Valida variáveis de ambiente antes de criar o Prisma Client

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Função para criar uma nova instância do Prisma Client
function createPrismaClient() {
  // Valida se DATABASE_URL está configurada
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

  return new PrismaClient({
    log: ['error', 'warn'],
  });
}

// Verificar se já existe uma instância no global
let prismaInstance = globalForPrisma.prisma;

// Se não existe ou se apiToken não está disponível, criar nova instância
if (!prismaInstance || !prismaInstance.apiToken) {
  prismaInstance = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;

