import * as Sentry from '@sentry/nextjs'

// Privacy-first: only initialize if a DSN is configured AND we're in production (skip dev overhead).
const isDevelopment = process.env.NODE_ENV === 'development'
if (process.env.SENTRY_DSN && !isDevelopment) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    enableLogs: true,
  })
}
