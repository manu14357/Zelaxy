/**
 * Zelaxy - Edge Runtime Instrumentation (DISABLED)
 *
 * All telemetry and tracking functionality has been removed.
 */

import { createLogger } from './lib/logs/console/logger'

const logger = createLogger('EdgeInstrumentation')

export async function register() {
  // Edge Runtime instrumentation disabled
  logger.info('Edge Runtime instrumentation disabled by configuration')
}
