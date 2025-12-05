import { Controller, Get, Post } from '@nestjs/common';
import { createQueue, createRedisConnection, QUEUES } from '@core-queue/index';

@Controller('debug')
export class DebugQueueController {
  private readonly schedulerQueue = createQueue(QUEUES.SCHEDULER);

  @Get('redis-ping')
  async redisPing(): Promise<{ status: string; connected: boolean }> {
    const redis = createRedisConnection();
    const status = redis.status;
    try {
      await redis.ping();
      return { status, connected: true };
    } catch (err) {
      return { status, connected: false };
    }
  }

  @Post('enqueue-test')
  async enqueueTest(): Promise<{ jobId: string }> {
    console.log('[debug] Adding job to queue...');
    console.log('[debug] Queue name:', this.schedulerQueue.name);
    
    const job = await this.schedulerQueue.add('test-job', {
      date: new Date().toISOString().slice(0, 10),
    });
    
    console.log('[debug] Job added:', job.id);
    return { jobId: job.id ?? 'unknown' };
  }
}
