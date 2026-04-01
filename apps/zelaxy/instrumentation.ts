import * as Sentry from '@sentry/nextjs'

export async function register() {
  console.log('[Main Instrumentation] register() called, environment:', {
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    NODE_ENV: process.env.NODE_ENV,
  })

  // Load Node.js-specific instrumentation (Sentry + local cron jobs)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')

    const nodeInstrumentation = await import('./instrumentation-node')
    if (nodeInstrumentation.register) {
      await nodeInstrumentation.register()
    }
  }

  // Load Edge Runtime-specific instrumentation
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')

    const edgeInstrumentation = await import('./instrumentation-edge')
    if (edgeInstrumentation.register) {
      await edgeInstrumentation.register()
    }
  }
}

// Automatically capture all unhandled server-side request errors
export const onRequestError = Sentry.captureRequestError
