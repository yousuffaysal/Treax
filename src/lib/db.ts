import { PrismaClient } from '@prisma/client';

/**
 * A single PrismaClient per process. Next dev reloads modules on every edit, so
 * without the global cache each reload would open a fresh Neon pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
