/**
 * Zelaxy Telemetry Configuration - DISABLED
 *
 * All telemetry functionality has been disabled.
 */

export default {
  endpoint: '',
  serviceName: 'zelaxy-personal',
  serviceVersion: '0.1.0',
  serverSide: { enabled: false },
  clientSide: { enabled: false },
  batchSettings: {
    maxQueueSize: 0,
    maxExportBatchSize: 0,
    scheduledDelayMillis: 0,
    exportTimeoutMillis: 0,
  },
}
