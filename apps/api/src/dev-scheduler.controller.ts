/**
 * Dev Scheduler Controller
 * Provides endpoints for manually triggering scheduling operations.
 * 
 * WARNING: These endpoints are for development/testing only.
 * TODO: Add proper authentication before exposing in production.
 */

import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { getAccountById, createJob } from '@core-db/index';
import { createQueue, QUEUES, type PublishJobPayload, type PlatformType } from '@core-queue/index';
import { runDailyPlannerForDate } from '../../worker-jobs/src/daily-planner';

// Get the PUBLISH queue
const publishQueue = createQueue(QUEUES.PUBLISH);

interface ScheduleImmediateBody {
  accountId: string;
  platform?: PlatformType;
}

interface RunPlannerBody {
  date?: string; // ISO date string, defaults to today
}

@Controller('dev')
export class DevSchedulerController {
  /**
   * Schedule an immediate publish for a single account.
   * Creates a JobRecord with scheduledFor = now and enqueues with delay: 0.
   * 
   * @example
   * POST /dev/schedule-immediate
   * { "accountId": "clxxx...", "platform": "instagram" }
   */
  @Post('schedule-immediate')
  @HttpCode(200)
  async scheduleImmediate(
    @Body() body: ScheduleImmediateBody
  ): Promise<{
    success: boolean;
    jobRecord: { id: string; accountId: string; scheduledFor: string; status: string };
    bullmqJobId: string;
  }> {
    const { accountId, platform = 'instagram' } = body;

    if (!accountId) {
      throw new BadRequestException('accountId is required');
    }

    // Validate account exists
    const account = await getAccountById(accountId);
    if (!account) {
      throw new BadRequestException(`Account not found: ${accountId}`);
    }

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

    // Enqueue with no delay (immediate)
    const bullmqJob = await publishQueue.add('publish', payload, {
      delay: 0,
      jobId: `publish-${jobRecord.id}`,
    });

    console.log(
      `[DevScheduler] Immediate publish scheduled for "${account.name}": ` +
      `Job ${jobRecord.id}, BullMQ ${bullmqJob.id}`
    );

    return {
      success: true,
      jobRecord: {
        id: jobRecord.id,
        accountId: jobRecord.accountId,
        scheduledFor: jobRecord.scheduledFor.toISOString(),
        status: jobRecord.status,
      },
      bullmqJobId: bullmqJob.id ?? 'unknown',
    };
  }

  /**
   * Manually trigger the daily planner for a specific date.
   * Creates JobRecords and enqueues delayed PUBLISH jobs for all accounts.
   * 
   * @example
   * POST /dev/run-planner
   * { "date": "2025-12-06" } // optional, defaults to today
   */
  @Post('run-planner')
  @HttpCode(200)
  async runPlanner(
    @Body() body: RunPlannerBody
  ): Promise<{ success: boolean; date: string }> {
    const date = body?.date ? new Date(body.date) : new Date();
    
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    console.log(`[DevScheduler] Manually triggering planner for ${date.toISOString().slice(0, 10)}`);
    
    await runDailyPlannerForDate(date);

    return {
      success: true,
      date: date.toISOString().slice(0, 10),
    };
  }

  /**
   * Run planner for today (convenience endpoint)
   * 
   * @example
   * POST /dev/run-planner-today
   */
  @Post('run-planner-today')
  @HttpCode(200)
  async runPlannerToday(): Promise<{ success: boolean; date: string }> {
    const today = new Date();
    
    console.log(`[DevScheduler] Running planner for today: ${today.toISOString().slice(0, 10)}`);
    
    await runDailyPlannerForDate(today);

    return {
      success: true,
      date: today.toISOString().slice(0, 10),
    };
  }
}

