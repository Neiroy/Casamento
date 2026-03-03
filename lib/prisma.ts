import { PrismaClient } from '@prisma/client';

/**
 * Singleton do Prisma Client para evitar múltiplas instâncias em desenvolvimento.
 * Em produção cada requisição usa a mesma instância.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
