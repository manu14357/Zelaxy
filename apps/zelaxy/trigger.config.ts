import { defineConfig } from '@trigger.dev/sdk/v3'

/**
 * Required environment variables for Trigger.dev workers
 * These must be set in the Trigger.dev dashboard (Settings > Environment Variables)
 * for BOTH Development and Production environments — Vercel env vars are NOT shared.
 *
 * Required:
 *   DATABASE_URL          — PostgreSQL connection string (e.g. Supabase direct URL)
 *   ENCRYPTION_KEY        — 32+ char key for decrypting user secrets
 *
 * Optional but recommended:
 *   POSTGRES_URL          — Alternative Postgres URL (used before DATABASE_URL)
 *   SENTRY_DSN            — For error tracking in workers
 *   ENABLE_CONSOLE_LOGS   — Set to "true" to enable verbose logging
 */
const REQUIRED_WORKER_ENV_VARS = ['DATABASE_URL', 'ENCRYPTION_KEY'] as const

export default defineConfig({
  project: 'proj_zunnejsqpkvkzywyajao',
  runtime: 'node',
  logLevel: 'log',
  maxDuration: 180,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 1,
    },
  },
  dirs: ['./background'],
  init: async () => {
    // Validate that critical environment variables exist in the Trigger.dev worker runtime.
    // These must be configured in the Trigger.dev dashboard, not just in Vercel.
    const missing = REQUIRED_WORKER_ENV_VARS.filter((key) => !process.env[key])

    if (missing.length > 0) {
      const message = [
        `[Trigger.dev Worker] Missing required environment variables: ${missing.join(', ')}`,
        'These must be set in the Trigger.dev dashboard under Settings > Environment Variables.',
        'Vercel environment variables are NOT automatically shared with Trigger.dev workers.',
        `Current environment: NODE_ENV=${process.env.NODE_ENV}, ` +
          `TRIGGER_SECRET_KEY prefix=${process.env.TRIGGER_SECRET_KEY?.slice(0, 7) || 'MISSING'}`,
      ].join('\n')

      console.error(message)
      throw new Error(message)
    }

    console.log('[Trigger.dev Worker] Environment check passed', {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
      nodeEnv: process.env.NODE_ENV,
      triggerKeyPrefix: process.env.TRIGGER_SECRET_KEY?.slice(0, 7) || 'MISSING',
    })
  },
  build: {
    extensions: [
      {
        name: 'increase-memory',
        onBuildComplete(context) {
          // Increase Node.js heap memory for workers that process
          // file attachments (PDF parsing, DWG parsing, etc.)
          if (context.target === 'dev') {
            process.env.NODE_OPTIONS = '--max-old-space-size=1024'
          }
        },
      },
    ],
  },
})
