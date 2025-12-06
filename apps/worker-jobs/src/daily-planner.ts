/**
 * Daily Planner - Creates JobRecords and enqueues delayed PUBLISH jobs
 * 
 * Architecture:
 * - Runs once per day at 2 AM PDT
 * - Creates JobRecords in DB with scheduledFor times
 * - Enqueues delayed PUBLISH jobs that fire at scheduledFor time
 * - No polling/dispatcher needed - BullMQ handles timing
 */

import { getAllAccounts, createJob } from '@core-db/index';
import { getRandomTimesInWindow, randomInt } from '@core-types/time-utils';
import { createQueue, QUEUES, type PublishJobPayload } from '@core-queue/index';
import type { Job } from '../../../generated/prisma';

// Get the PUBLISH queue (cached singleton)
const publishQueue = createQueue(QUEUES.PUBLISH);

/**
 * Runs the daily planner for a given date.
 * 
 * For each account:
 * 1. Determines random number of posts (between min/max)
 * 2. Generates random times within posting window
 * 3. Creates JobRecord in DB (status: PENDING)
 * 4. Enqueues delayed PUBLISH job to fire at scheduledFor time
 * 
 * @param date - The date to plan for (typically today in the planning timezone)
 */
export async function runDailyPlannerForDate(date: Date): Promise<void> {
  const dateStr = date.toISOString().slice(0, 10);
  console.log(`[DailyPlanner] Starting planning for ${dateStr}`);

  // 1. Fetch all accounts
  const accounts = await getAllAccounts();
  console.log(`[DailyPlanner] Found ${accounts.length} accounts`);

  if (accounts.length === 0) {
    console.log('[DailyPlanner] No accounts to plan for');
    return;
  }

  const stats = {
    totalJobs: 0,
    totalQueued: 0,
    accounts: [] as { name: string; jobs: number }[],
  };

  // 2. Process each account
  for (const account of accounts) {
    // Determine number of posts for this account
    const nPosts = randomInt(account.minPostsPerDay, account.maxPostsPerDay);

    if (nPosts <= 0) {
      console.log(`[DailyPlanner] Account "${account.name}": skipping (nPosts=0)`);
      continue;
    }

    // Generate random times within the posting window
    const scheduledTimes = getRandomTimesInWindow(account, date, nPosts);

    console.log(
      `[DailyPlanner] Account "${account.name}": scheduling ${nPosts} posts ` +
      `(window: ${account.postingWindowStart}-${account.postingWindowEnd} ${account.timezone})`
    );

    // 3. Create jobs and enqueue delayed PUBLISH jobs
    for (const scheduledFor of scheduledTimes) {
      const jobRecord = await createJobAndEnqueuePublish({
        accountId: account.id,
        scheduledFor,
        platform: 'instagram', // Default platform for now
      });

      console.log(
        `[DailyPlanner]   → Job ${jobRecord.id} scheduled for ${scheduledFor.toISOString()}`
      );
      stats.totalJobs++;
      stats.totalQueued++;
    }

    stats.accounts.push({ name: account.name, jobs: nPosts });
  }

  // 4. Summary
  console.log('[DailyPlanner] Planning complete:', {
    date: dateStr,
    totalJobs: stats.totalJobs,
    totalQueued: stats.totalQueued,
    breakdown: stats.accounts,
  });
}

/**
 * Creates a JobRecord in DB and enqueues a delayed PUBLISH job.
 * 
 * @returns The created JobRecord
 */
async function createJobAndEnqueuePublish(params: {
  accountId: string;
  scheduledFor: Date;
  platform: 'instagram' | 'youtube' | 'tiktok';
}): Promise<Job> {
  const { accountId, scheduledFor, platform } = params;

  // Create JobRecord in DB with status PENDING
  const jobRecord = await createJob({
    accountId,
    scheduledFor,
  });

  // Calculate delay in milliseconds
  const delayMs = Math.max(0, scheduledFor.getTime() - Date.now());

  // Build payload for PUBLISH queue
  const payload: PublishJobPayload = {
    jobId: jobRecord.id,
    accountId,
    platform,
    scheduledFor: scheduledFor.toISOString(),
  };

  // Enqueue delayed PUBLISH job
  // BullMQ will automatically process this job when the delay expires
  await publishQueue.add('publish', payload, {
    delay: delayMs,
    jobId: `publish-${jobRecord.id}`, // Use predictable job ID for deduplication
  });

  return jobRecord;
}

/**
 * Schedules an immediate publish for a single account (for dev/testing).
 * Creates a JobRecord with scheduledFor = now and enqueues with delay: 0.
 * 
 * @param accountId - The account to schedule for
 * @param platform - Target platform (default: instagram)
 * @returns The created JobRecord and BullMQ job ID
 */
export async function scheduleImmediatePublish(
  accountId: string,
  platform: 'instagram' | 'youtube' | 'tiktok' = 'instagram'
): Promise<{ jobRecord: Job; bullmqJobId: string }> {
  const scheduledFor = new Date();

  // Create JobRecord in DB
  const jobRecord = await createJob({
    accountId,
    scheduledFor,
  });

  // Build payload
  const payload: PublishJobPayload = {
    jobId: jobRecord.id,
    accountId,
    platform,
    scheduledFor: scheduledFor.toISOString(),
  };

  // Enqueue with no delay
  const bullmqJob = await publishQueue.add('publish', payload, {
    delay: 0,
    jobId: `publish-${jobRecord.id}`,
  });

  console.log(
    `[DailyPlanner] Immediate publish scheduled: Job ${jobRecord.id}, BullMQ ${bullmqJob.id}`
  );

  return {
    jobRecord,
    bullmqJobId: bullmqJob.id ?? 'unknown',
  };
}

// =============================================================================
// TODO: Phase 6 - Content Generation Integration
// =============================================================================
// 
// The PUBLISH worker will eventually:
// 1. Load the JobRecord and Account/Theme from DB
// 2. Call LLM to generate idea (JobIdea)
// 3. Call LLM to generate scripts (JobScripts)
// 4. Call media pipeline to generate assets (JobAssets)
// 5. Upload to Instagram via ig-client
// 6. Update JobRecord with status and analytics
//
// For now, the PUBLISH worker just logs and marks complete.

