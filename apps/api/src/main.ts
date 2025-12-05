import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getConfig } from '@core-config/index';

async function bootstrap() {
  // Validate config early - throws if env vars are missing/invalid
  const config = getConfig();
  console.log(`✓ Config loaded [NODE_ENV=${config.NODE_ENV}]`);

  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  
  await app.listen(port);
  console.log(`✓ API server listening on port ${port}`);
}

bootstrap();
