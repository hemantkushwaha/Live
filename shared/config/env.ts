import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  API_BASE_URL: z.string().default('http://localhost:3000/api/v1'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET must be configured and non-empty'),
  STUN_SERVER: z.string().default('stun:stun.l.google.com:19302'),
  TURN_SERVER: z.string().default('turn:global.turn.twilio.com:3478'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, string | undefined>): EnvConfig {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.error('❌ Environment Configuration Error:\n' + formattedErrors);
    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }

  return result.data;
}
