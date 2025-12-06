/**
 * Worker Jobs - Background job processing worker
 * 
 * Architecture (BullMQ Delayed Jobs):
 * - Daily planner cron runs at 2 AM PDT
 * - Creates JobRecords in DB and enqueues delayed PUBLISH jobs
 * - PUBLISH worker processes jobs when their delay expires
 * - No polling/dispatcher needed - BullMQ handles timing
 */

import cron from 'node-cron';
import { getConfig } from '@core-config/index';
import { getAccountById, updateJob } from '@core-db/index';
import { 
  QUEUES, 
  createWorker, 
  closeRedisConnection,
  type PublishJobPayload,
} from '@core-queue/index';
import { runDailyPlannerForDate } from './daily-planner';

// =============================================================================
// Startup
// =============================================================================

const config = getConfig();
console.log(`[worker-jobs] Starting worker [NODE_ENV=${config.NODE_ENV}]`);

// =============================================================================
// Daily Planner Cron (2 AM PDT)
// =============================================================================

function setupDailyCron() {
  // '0 2 * * *' = every day at 02:00 in the specified timezone
  cron.schedule(
    '0 2 * * *',
    async () => {
      const now = new Date();
      console.log(`[DailyPlanner] Cron triggered at ${now.toISOString()}`);
      
      try {
        // Run planner for today (in PDT context)
        await runDailyPlannerForDate(now);
      } catch (err) {
        console.error('[DailyPlanner] Cron error:', err);
      }
    },
    { 
      timezone: 'America/Los_Angeles' // PDT/PST
    }
  );

  console.log('[worker-jobs] Daily planner cron scheduled (2 AM PDT)');
}

// Initialize cron
setupDailyCron();

// =============================================================================
// PUBLISH Worker
// =============================================================================

const publishWorker = createWorker(
  QUEUES.PUBLISH,
  async (job) => {
    const payload: PublishJobPayload = job.data;
    console.log(`[PUBLISH] Processing job ${job.id}:`, {
      jobId: payload.jobId,
      accountId: payload.accountId,
      platform: payload.platform,
      scheduledFor: payload.scheduledFor,
    });

    try {
      // Mark job as RUNNING
      await updateJob(payload.jobId, { status: 'RUNNING' });

      // Load account for context
      const account = await getAccountById(payload.accountId);
      if (!account) {
        throw new Error(`Account not found: ${payload.accountId}`);
      }

      // =======================================================================
      // TODO: Phase 6 - Content Generation Pipeline
      // =======================================================================
      // 
      // 1. Generate idea using LLM (based on theme.promptConfig)
      //    const idea = await generateIdea(account, account.theme);
      //    await updateJob(payload.jobId, { idea });
      //
      // 2. Generate scripts using LLM
      //    const scripts = await generateScripts(account, idea);
      //    await updateJob(payload.jobId, { scripts });
      //
      // 3. Generate media assets
      //    const assets = await generateMedia(account, scripts);
      //    await updateJob(payload.jobId, { assets });
      //
      // 4. Upload to platform
      //    const result = await publishToPlatform(payload.platform, account, assets);
      //    await updateJob(payload.jobId, { 
      //      status: 'POSTED',
      //      igMediaId: result.mediaId,
      //      finalVideoUrl: result.url,
      //    });
      //
      // For now, just simulate success:
      console.log(`[PUBLISH] Job ${payload.jobId} for "${account.name}" - placeholder processing`);
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark as POSTED (placeholder)
      await updateJob(payload.jobId, { status: 'POSTED' });

      console.log(`[PUBLISH] Job ${payload.jobId} completed successfully`);
      
      return { 
        success: true, 
        jobId: payload.jobId,
        platform: payload.platform,
      };
    } catch (err) {
      console.error(`[PUBLISH] Job ${payload.jobId} failed:`, err);
      
      // Mark job as FAILED
      await updateJob(payload.jobId, { 
        status: 'FAILED',
        error: err instanceof Error ? err.message : 'Unknown error',
      });

      throw err; // Re-throw so BullMQ marks the job as failed
    }
  }
);

console.log('[worker-jobs] PUBLISH worker started');

// =============================================================================
// Graceful Shutdown
// =============================================================================

async function shutdown() {
  console.log('[worker-jobs] Shutting down...');
  
  // Close BullMQ workers
  await publishWorker.close();
  
  // Close Redis connection
  await closeRedisConnection();
  
  console.log('[worker-jobs] Shutdown complete');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('[worker-jobs] Worker fully initialized and running');

// =============================================================================
// DEPRECATED: Old polling-based dispatcher
// =============================================================================
// 
// The old architecture used:
// - Cron to create jobs at midnight
// - Polling dispatcher (every 30s) to find due jobs and enqueue
//
// New architecture uses:
// - Cron at 2 AM PDT
// - BullMQ delayed jobs (no polling needed)
//
// Old files (can be removed once stable):
// - dispatcher.ts
// - planner.ts (replaced by daily-planner.ts)
