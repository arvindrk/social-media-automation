import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { DebugQueueController } from './debug-queue.controller';
import { DevSchedulerController } from './dev-scheduler.controller';

@Module({
  imports: [],
  controllers: [
    AppController, 
    HealthController, 
    DebugQueueController,
    DevSchedulerController,
  ],
  providers: [AppService],
})
export class AppModule {}
