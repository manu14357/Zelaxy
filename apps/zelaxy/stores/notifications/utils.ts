import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('NotificationUtils')

/**
 * Dispatches a message to the zelaxyarena chat via a custom window event.
 * The zelaxyarena `Home` component listens for this event and calls `sendMessage`.
 */
export function sendZelaxyarenaMessage(message: string): void {
  const trimmed = message.trim()
  if (!trimmed) {
    logger.warn('sendZelaxyarenaMessage called with empty message')
    return
  }
  window.dispatchEvent(
    new CustomEvent('zelaxyarena-send-message', { detail: { message: trimmed } })
  )
  logger.info('Dispatched zelaxyarena message event', { messageLength: trimmed.length })
}
