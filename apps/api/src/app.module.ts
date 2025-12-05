import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Path alias imports - examples (uncomment when needed):
// import type { BrandId } from '@core-types/index';
// import { getConfigNotInitialized } from '@core-config/index';
// import { QUEUE_TEST } from '@core-queue/index';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
