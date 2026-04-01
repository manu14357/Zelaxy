// Zelaxy client-side instrumentation
// This file is loaded when the application runs in the browser

import * as Sentry from '@sentry/nextjs'

// Privacy-first: only initialize if DSN is explicitly configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,

    // 100% in dev, 10% in production
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

    // Session Replay: 10% of all sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: true,

    integrations: [Sentry.replayIntegration()],
  })
}

// Required for Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
