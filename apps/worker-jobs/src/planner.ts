/**
 * Daily Planner - Creates scheduled jobs for each account
 * Runs once per day at 00:00 server time
 */

import { getAllAccounts, createJobs } from '@core-db/index';
import type { CreateJobInput } from '@core-types/index';
import { getRandomTimesInWindow, randomInt } from '@core-types/time-utils';

/**
 * Runs the daily planner to create jobs for all accounts.
 * 
 * For each account:
 * 1. Determines number of posts (random between min and max)
 * 2. Generates random times within the posting window
 * 3. Creates PENDING jobs for each scheduled time
 * 
 * @param date - The date to plan for (typically today)
 */
export async function runDailyPlanner(date: Date): Promise<void> {
  const dateStr = date.toISOString().slice(0, 10);
  console.log(`[Planner] Starting daily planning for ${dateStr}`);

  // 1. Fetch all accounts
  const accounts = await getAllAccounts();
  console.log(`[Planner] Found ${accounts.length} accounts`);

  if (accounts.length === 0) {
    console.log('[Planner] No accounts to plan for');
    return;
  }

  // 2. Build job inputs for each account
  const allJobInputs: CreateJobInput[] = [];
  const accountStats: { name: string; count: number }[] = [];

  for (const account of accounts) {
    // Determine number of posts for this account
    const nPosts = randomInt(account.minPostsPerDay, account.maxPostsPerDay);

    if (nPosts <= 0) {
      console.log(`[Planner] Account "${account.name}": skipping (nPosts=${nPosts})`);
      continue;
    }

    // Generate random times within the posting window
    const scheduledTimes = getRandomTimesInWindow(account, date, nPosts);

    // Build CreateJobInput for each time
    for (const scheduledFor of scheduledTimes) {
      allJobInputs.push({
        accountId: account.id,
        scheduledFor,
      });
    }

    accountStats.push({ name: account.name, count: nPosts });
    console.log(
      `[Planner] Account "${account.name}": ${nPosts} jobs scheduled ` +
      `(window: ${account.postingWindowStart}-${account.postingWindowEnd} ${account.timezone})`
    );
  }

  // 3. Create all jobs in the database
  if (allJobInputs.length > 0) {
    const createdJobs = await createJobs(allJobInputs);
    console.log(`[Planner] Created ${createdJobs.length} total jobs`);
  } else {
    console.log('[Planner] No jobs to create');
  }

  // 4. Summary
  console.log('[Planner] Daily planning complete:', {
    date: dateStr,
    accountsProcessed: accountStats.length,
    totalJobs: allJobInputs.length,
    breakdown: accountStats,
  });
}

