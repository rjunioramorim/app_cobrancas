import { PrismaClient } from '@/generated/prisma/client';
import '@/lib/cron-init'; // Inicializa cron jobs

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Função para criar uma nova instância do Prisma Client
function createPrismaClient() {
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

