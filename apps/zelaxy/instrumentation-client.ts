// Zelaxy client-side instrumentation
// This file is loaded when the application runs in the browser

import * as Sentry from '@sentry/nextjs'

export function register() {
  // Zelaxy client-side instrumentation setup
  console.log('[Zelaxy Client Instrumentation] Zelaxy client instrumentation loaded')

  // Add any client-side monitoring, analytics, or error tracking here
}

// Required for Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
