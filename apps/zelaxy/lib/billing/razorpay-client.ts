import Razorpay from 'razorpay'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('RazorpayClient')

/**
 * Check if Razorpay credentials are configured
 */
export function hasValidRazorpayCredentials(): boolean {
  return !!(
    env.RAZORPAY_KEY_ID &&
    env.RAZORPAY_KEY_SECRET &&
    env.RAZORPAY_KEY_ID.trim() !== '' &&
    env.RAZORPAY_KEY_SECRET.trim() !== ''
  )
}

/**
 * Secure Razorpay client singleton with initialization guard
 */
const createRazorpayClientSingleton = () => {
  let razorpayClient: Razorpay | null = null
  let isInitializing = false

  return {
    getInstance(): Razorpay | null {
      if (razorpayClient) return razorpayClient

      if (isInitializing) {
        logger.debug('Razorpay client initialization already in progress')
        return null
      }

      if (!hasValidRazorpayCredentials()) {
        logger.warn('Razorpay credentials not available - Razorpay operations will be disabled')
        return null
      }

      try {
        isInitializing = true

        razorpayClient = new Razorpay({
          key_id: env.RAZORPAY_KEY_ID,
          key_secret: env.RAZORPAY_KEY_SECRET,
        })

        logger.info('Razorpay client initialized successfully')
        return razorpayClient
      } catch (error) {
        logger.error('Failed to initialize Razorpay client', { error })
        razorpayClient = null
        return null
      } finally {
        isInitializing = false
      }
    },
  }
}

const razorpayClientSingleton = createRazorpayClientSingleton()

/**
 * Get the Razorpay client instance
 * @returns Razorpay client or null if credentials are not available
 */
export function getRazorpayClient(): Razorpay | null {
  return razorpayClientSingleton.getInstance()
}

/**
 * Get the Razorpay client instance, throwing an error if not available.
 * Use this when Razorpay operations are required.
 */
export function requireRazorpayClient(): Razorpay {
  const client = getRazorpayClient()

  if (!client) {
    throw new Error(
      'Razorpay client is not available. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.'
    )
  }

  return client
}
