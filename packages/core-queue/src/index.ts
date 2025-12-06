/**
 * @core-queue - BullMQ job queue abstraction
 * Provides type-safe queue creation and job processing
 */

import { Queue, Worker, type Processor, type QueueOptions, type WorkerOptions, type JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import { getConfig } from '@core-config/index';

// ============================================================================
// Queue Name Constants
// ============================================================================

export const QUEUES = {
  SCHEDULER: 'scheduler',
  CREATE_CONTENT: 'create_content',
  MEDIA_PIPELINE: 'media_pipeline',
  PUBLISH: 'publish',
  ANALYTICS: 'analytics',
} as const;

export type QueueName = typeof QUEUES[keyof typeof QUEUES];

// ============================================================================
// Platform Types
// ============================================================================

export type PlatformType = 'instagram' | 'youtube' | 'tiktok';

// ============================================================================
// Job Payload Types
// ============================================================================

export interface SchedulerJobPayload {
  date: string;
}

export interface CreateContentJobPayload {
  jobId: string;
  accountId: string;
}

export interface MediaPipelineJobPayload {
  jobId: string;
  mediaUrl: string;
}

/** Publish job payload - platform-agnostic publishing */
export interface PublishJobPayload {
  jobId: string;
  accountId: string;
  platform: PlatformType;
  scheduledFor: string; // ISO timestamp
}

export interface AnalyticsJobPayload {
  jobId: string;
  postId: string;
}

// ============================================================================
// Job Payloads Type Map
// ============================================================================

export interface JobPayloads {
  [QUEUES.SCHEDULER]: SchedulerJobPayload;
  [QUEUES.CREATE_CONTENT]: CreateContentJobPayload;
  [QUEUES.MEDIA_PIPELINE]: MediaPipelineJobPayload;
  [QUEUES.PUBLISH]: PublishJobPayload;
  [QUEUES.ANALYTICS]: AnalyticsJobPayload;
}

// ============================================================================
// Redis Connection
// ============================================================================

let redisConnection: Redis | null = null;

/**
 * Creates or returns a singleton Redis connection for BullMQ
 */
export function createRedisConnection(): Redis {
  if (redisConnection) {
    return redisConnection;
  }

  const config = getConfig();
  
  if (!config.REDIS_URL) {
    throw new Error('REDIS_URL is required for queue operations');
  }

  const isUpstash = config.REDIS_URL.includes('upstash.io');
  
  redisConnection = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false, // Helps with serverless Redis like Upstash
    ...(isUpstash && {
      tls: { rejectUnauthorized: false },
    }),
  });

  redisConnection.on('error', (err) => {
    console.error('[core-queue] Redis connection error:', err.message);
  });

  // 'ready' fires once when connection is established and ready
  redisConnection.once('ready', () => {
    console.log('[core-queue] Redis connected');
  });

  return redisConnection;
}

// ============================================================================
// Queue & Worker Factories
// ============================================================================

/** Cache for queue instances (singleton per queue name) */
const queueCache = new Map<QueueName, Queue<unknown>>();

/**
 * Gets or creates a type-safe BullMQ queue for a given queue name.
 * Queue instances are cached and reused.
 */
export function createQueue<Q extends QueueName>(
  queueName: Q,
  options?: Omit<QueueOptions, 'connection'>
): Queue<JobPayloads[Q]> {
  // Return cached queue if exists
  const cached = queueCache.get(queueName);
  if (cached) {
    return cached as Queue<JobPayloads[Q]>;
  }

  const connection = createRedisConnection();
  
  const queue = new Queue<JobPayloads[Q]>(queueName, {
    connection,
    ...options,
  });

  queueCache.set(queueName, queue as Queue<unknown>);
  return queue;
}

/**
 * Creates a type-safe BullMQ worker for a given queue name
 */
export function createWorker<Q extends QueueName>(
  queueName: Q,
  processor: Processor<JobPayloads[Q]>,
  options?: Omit<WorkerOptions, 'connection'>
): Worker<JobPayloads[Q]> {
  const connection = createRedisConnection();
  
  const worker = new Worker<JobPayloads[Q]>(queueName, processor, {
    connection,
    ...options,
  });

  worker.on('completed', (job) => {
    console.log(`[${queueName}] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${queueName}] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

/**
 * Gracefully closes the Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
    console.log('[core-queue] Redis connection closed');
  }
}

// Re-export JobsOptions for delayed job configuration
export type { JobsOptions };
