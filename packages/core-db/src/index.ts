/**
 * @core-db - Database connection via Prisma + Neon
 * Singleton pattern for PrismaClient to avoid multiple connections
 */

import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '../../../generated/prisma';
import { getConfig } from '@core-config/index';

/** Singleton PrismaClient instance */
let prismaInstance: PrismaClient | null = null;

/**
 * Gets or creates the singleton PrismaClient instance.
 * Uses Neon HTTP adapter for Prisma 7 (no WebSocket needed).
 */
function getPrismaClient(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  const config = getConfig();
  
  // Create Neon HTTP adapter - uses fetch, no WebSocket needed
  const adapter = new PrismaNeonHttp(config.DATABASE_URL, { fullResults: true });

  prismaInstance = new PrismaClient({
    adapter,
    log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return prismaInstance;
}

/**
 * Exported database client instance
 * Import this in api and workers to access the database
 */
export const db = getPrismaClient();

/**
 * Pings the database to verify connectivity
 * @throws if the database is unreachable
 */
export async function pingDb(): Promise<void> {
  await db.$queryRaw`SELECT 1`;
}

/**
 * Gracefully disconnects from the database
 * Call this during shutdown
 */
export async function disconnectDb(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
