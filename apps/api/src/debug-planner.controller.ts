/**
 * Debug Planner Controller
 * Provides endpoints for manually triggering planner and dispatcher
 * 
 * WARNING: These endpoints are for debugging only.
 * Do not expose in production without proper authentication.
 */

import { Controller, Post, HttpCode } from '@nestjs/common';
import { runDailyPlanner } from '../../worker-jobs/src/planner';
import { runDispatcher } from '../../worker-jobs/src/dispatcher';

@Controller('debug')
export class DebugPlannerController {
  /**
   * Manually trigger the daily planner for today
   * Creates jobs for all accounts based on their posting windows
   */
  @Post('run-planner-today')
  @HttpCode(200)
  async runPlannerToday(): Promise<{ success: boolean; date: string }> {
    const today = new Date();
    console.log('[API Debug] Triggering daily planner for', today.toISOString().slice(0, 10));
    
    await runDailyPlanner(today);
    
    return { 
      success: true, 
      date: today.toISOString().slice(0, 10) 
    };
  }

  /**
   * Manually trigger the dispatcher
   * Finds due jobs and enqueues them for processing
   */
  @Post('run-dispatcher-now')
  @HttpCode(200)
  async runDispatcherNow(): Promise<{ success: boolean; timestamp: string }> {
    const now = new Date();
    console.log('[API Debug] Triggering dispatcher at', now.toISOString());
    
    await runDispatcher(now);
    
    return { 
      success: true, 
      timestamp: now.toISOString() 
    };
  }
}

