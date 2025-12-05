/**
 * @core-config - Centralized configuration management
 * Uses Zod for runtime validation of environment variables
 */

import { z } from 'zod';

/**
 * Zod schema for application configuration
 * Required: DATABASE_URL
 * Optional: Everything else (will be required when those services are connected)
 */
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Required
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Optional until connected
  REDIS_URL: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),
  AWS_S3_REGION: z.string().optional(),
  AWS_S3_ACCESS_KEY_ID: z.string().optional(),
  AWS_S3_SECRET_ACCESS_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  VERCEL_AI_MODEL_DEFAULT: z.string().optional(),
});

/** Inferred TypeScript type from the Zod schema */
export type AppConfig = z.infer<typeof configSchema>;

/** Memoized config instance */
let cachedConfig: AppConfig | null = null;

/**
 * Parses and validates environment variables against the config schema.
 * Memoizes the result so parsing only happens once.
 * @throws {ZodError} if any required env vars are missing or invalid
 */
export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    console.error('❌ Invalid environment configuration:');
    console.error(JSON.stringify(formatted, null, 2));
    throw new Error('Invalid environment configuration. See above for details.');
  }

  cachedConfig = result.data;
  return cachedConfig;
}

/**
 * Resets the cached config (useful for testing)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}
