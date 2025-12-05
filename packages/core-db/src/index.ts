/**
 * @core-db - Database connection via Prisma + Neon
 * Singleton pattern for PrismaClient to avoid multiple connections
 */

import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient, Prisma } from '../../../generated/prisma';
import type { Account, Job, JobStatus } from '../../../generated/prisma';
import { getConfig } from '@core-config/index';
import type { CreateJobInput, UpdateJobInput } from '@core-types/index';

// =============================================================================
// Prisma Client Singleton
// =============================================================================

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

/** Internal database client - not exported */
const db = getPrismaClient();

// =============================================================================
// Connection Helpers
// =============================================================================

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

// =============================================================================
// Account Helpers
// =============================================================================

/**
 * Gets all accounts with their themes
 */
export async function getAllAccounts(): Promise<Account[]> {
  return db.account.findMany({
    include: { theme: true },
  });
}

/**
 * Gets an account by ID with its theme
 */
export async function getAccountById(id: string): Promise<Account | null> {
  return db.account.findUnique({
    where: { id },
    include: { theme: true },
  });
}

// =============================================================================
// Job Helpers
// =============================================================================

/**
 * Creates multiple jobs in a batch
 */
export async function createJobs(jobs: CreateJobInput[]): Promise<Job[]> {
  const createdJobs: Job[] = [];
  
  for (const job of jobs) {
    const created = await db.job.create({
      data: {
        accountId: job.accountId,
        scheduledFor: job.scheduledFor,
        status: 'PENDING',
      },
    });
    createdJobs.push(created);
  }
  
  return createdJobs;
}

/**
 * Finds jobs that are due to be processed
 * (status is PENDING and scheduledFor <= now)
 */
export async function findDueJobs(now: Date): Promise<Job[]> {
  return db.job.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: 'asc' },
  });
}

/**
 * Updates a job by ID
 */
export async function updateJob(jobId: string, data: UpdateJobInput): Promise<Job> {
  const updateData: Prisma.JobUpdateInput = {};
  
  if (data.status) updateData.status = data.status as JobStatus;
  if (data.idea !== undefined) updateData.idea = data.idea as unknown as Prisma.InputJsonValue;
  if (data.scripts !== undefined) updateData.scripts = data.scripts as unknown as Prisma.InputJsonValue;
  if (data.assets !== undefined) updateData.assets = data.assets as unknown as Prisma.InputJsonValue;
  if (data.finalVideoUrl !== undefined) updateData.finalVideoUrl = data.finalVideoUrl;
  if (data.igMediaId !== undefined) updateData.igMediaId = data.igMediaId;
  if (data.error !== undefined) updateData.error = data.error;
  if (data.analytics !== undefined) updateData.analytics = data.analytics as unknown as Prisma.InputJsonValue;

  return db.job.update({
    where: { id: jobId },
    data: updateData,
  });
}

/**
 * Gets a job by ID
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  return db.job.findUnique({
    where: { id: jobId },
  });
}

/**
 * Gets all jobs for an account
 */
export async function getJobsByAccountId(accountId: string): Promise<Job[]> {
  return db.job.findMany({
    where: { accountId },
    orderBy: { scheduledFor: 'desc' },
  });
}
