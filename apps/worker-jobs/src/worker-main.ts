/**
 * Worker Jobs - Background job processing worker
 * 
 * Responsibilities:
 * - Daily planner cron (00:00 server time) to create jobs for each account
 * - Dispatcher loop (every 30s) to find and dispatch due jobs
 * - BullMQ workers for queue processing
 */

import cron from 'node-cron';
import { getConfig } from '@core-config/index';
import { 
  QUEUES, 
  createWorker, 
  closeRedisConnection,
  type CreateContentJobPayload,
} from '@core-queue/index';
import { runDailyPlanner } from './planner';
import { runDispatcher } from './dispatcher';

// =============================================================================
// Startup
// =============================================================================

const config = getConfig();
console.log(`[worker-jobs] Starting worker [NODE_ENV=${config.NODE_ENV}]`);

// =============================================================================
// Daily Planner Cron
// =============================================================================

// Schedule daily planner at 00:00 server time
cron.schedule('0 0 * * *', async () => {
  const today = new Date();
  console.log('[Planner] Cron triggered for', today.toISOString().slice(0, 10));
  
  try {
    await runDailyPlanner(today);
  } catch (err) {
    console.error('[Planner] Cron error:', err);
  }
});

console.log('[worker-jobs] Daily planner cron scheduled (00:00 server time)');

// =============================================================================
// Dispatcher Loop
// =============================================================================

// Run dispatcher every 30 seconds to find and dispatch due jobs
// Note: In production, consider leader election or distributed locking
// to prevent multiple instances from dispatching the same jobs
const DISPATCHER_INTERVAL_MS = 30_000;

setInterval(() => {
  runDispatcher(new Date()).catch(err => {
    console.error('[Dispatcher] Interval error:', err);
  });
}, DISPATCHER_INTERVAL_MS);

console.log(`[worker-jobs] Dispatcher loop started (every ${DISPATCHER_INTERVAL_MS / 1000}s)`);

// =============================================================================
// BullMQ Workers
// =============================================================================

// CREATE_CONTENT worker - processes content creation jobs
const createContentWorker = createWorker(
  QUEUES.CREATE_CONTENT,
  async (job) => {
    const payload: CreateContentJobPayload = job.data;
    console.log(`[CREATE_CONTENT] Processing job ${job.id}:`, payload);
    
    // TODO: Implement actual content creation pipeline
    // 1. Load account and theme from DB
    // 2. Generate idea
    // 3. Write scripts
    // 4. Generate media
    // 5. Publish to Instagram
    // 6. Update job status
    
    // For now, just log and mark as complete
    console.log(`[CREATE_CONTENT] Job ${payload.jobId} for account ${payload.accountId} - placeholder processing`);
    
    return { processed: true, jobId: payload.jobId };
  }
);

console.log('[worker-jobs] CREATE_CONTENT worker started');

// =============================================================================
// Graceful Shutdown
// =============================================================================

async function shutdown() {
  console.log('[worker-jobs] Shutting down...');
  
  // Close BullMQ workers
  await createContentWorker.close();
  
  // Close Redis connection
  await closeRedisConnection();
  
  console.log('[worker-jobs] Shutdown complete');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('[worker-jobs] Worker fully initialized and running');
