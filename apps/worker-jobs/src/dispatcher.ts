/**
 * Dispatcher - Finds due jobs and enqueues them for processing
 * Runs on a regular interval (e.g., every 30 seconds)
 */

import { findDueJobs, updateJob } from '@core-db/index';
import { createQueue, QUEUES } from '@core-queue/index';

// Create content queue (cached singleton)
const createContentQueue = createQueue(QUEUES.CREATE_CONTENT);

/**
 * Finds jobs that are due (PENDING and scheduledFor <= now) and dispatches them.
 * 
 * For each due job:
 * 1. Marks the job as RUNNING
 * 2. Enqueues a CREATE_CONTENT job with { jobId, accountId }
 * 
 * Note: In production, you might want leader election or distributed locking
 * to prevent multiple dispatcher instances from processing the same jobs.
 * For now, we assume a single dispatcher instance.
 * 
 * @param now - The current time to check against
 */
export async function runDispatcher(now: Date): Promise<void> {
  // Find all due jobs
  const dueJobs = await findDueJobs(now);

  if (dueJobs.length === 0) {
    return; // Nothing to dispatch, silent return
  }

  console.log(`[Dispatcher] Found ${dueJobs.length} due jobs`);

  let dispatched = 0;
  let failed = 0;

  for (const job of dueJobs) {
    try {
      // 1. Mark as RUNNING (optimistic update)
      await updateJob(job.id, { status: 'RUNNING' });

      // 2. Enqueue create-content job
      await createContentQueue.add('create-content', {
        jobId: job.id,
        accountId: job.accountId,
      });

      dispatched++;
      console.log(`[Dispatcher] Dispatched job ${job.id} for account ${job.accountId}`);
    } catch (err) {
      failed++;
      console.error(`[Dispatcher] Failed to dispatch job ${job.id}:`, err);
      
      // Optionally: mark job as FAILED or leave as PENDING for retry
      try {
        await updateJob(job.id, { 
          status: 'FAILED', 
          error: err instanceof Error ? err.message : 'Dispatch failed' 
        });
      } catch {
        // Ignore update errors
      }
    }
  }

  console.log(`[Dispatcher] Dispatch complete: ${dispatched} dispatched, ${failed} failed`);
}

