import { Controller, Get } from '@nestjs/common';
import { pingDb } from '@core-db/index';

@Controller('health')
export class HealthController {
  @Get('db')
  async checkDatabase(): Promise<{ ok: boolean }> {
    await pingDb();
    return { ok: true };
  }
}

