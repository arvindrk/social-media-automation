/**
 * Worker Jobs - Background job processing worker
 * Processes jobs from BullMQ queues
 */

import { getConfig } from '@core-config/index';
import { 
  QUEUES, 
  createWorker, 
  closeRedisConnection,
  type SchedulerJobPayload 
} from '@core-queue/index';

// Validate config on startup
const config = getConfig();
console.log(`[worker-jobs] Starting worker [NODE_ENV=${config.NODE_ENV}]`);

// Create SCHEDULER worker
const schedulerWorker = createWorker(
  QUEUES.SCHEDULER,
  async (job) => {
    const payload: SchedulerJobPayload = job.data;
    console.log(`[worker-jobs] Processing SCHEDULER job ${job.id}:`, payload);
    
    // TODO: Implement actual scheduling logic
    // For now, just log and resolve
    
    return { processed: true, date: payload.date };
  }
);

console.log('[worker-jobs] SCHEDULER worker started, waiting for jobs...');

// Graceful shutdown
async function shutdown() {
  console.log('[worker-jobs] Shutting down...');
  await schedulerWorker.close();
  await closeRedisConnection();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

