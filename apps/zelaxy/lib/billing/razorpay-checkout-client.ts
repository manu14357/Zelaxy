'use client'

import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('RazorpayCheckoutClient')

const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

/** Zelaxy's primary brand colour (globals.css `--primary`, hsl(25 95% 53%)). */
const BRAND_COLOR = '#f97415'

/**
 * Broadcast just before Razorpay Checkout opens. Every upgrade entry point
 * lives inside a Radix Dialog, and Radix's modal mode sets
 * `pointer-events: none` on <body> and traps focus - Razorpay appends its
 * iframe to <body>, outside that scope, so it renders but silently swallows
 * every click and keystroke. Overlays listen for this and close themselves.
 * An event rather than a prop because the settings modal's open state lives
 * in local component state in two separate parents, and the deepest caller
 * (team management) has no handle on it at all.
 */
export const CLOSE_OVERLAYS_EVENT = 'zelaxy:close-overlays'

/** Razorpay renders our logo from inside its own https iframe, so an http
 * localhost URL would be blocked as mixed content - skip it in local dev. */
function getBrandLogoUrl(): string | undefined {
  if (typeof window === 'undefined' || window.location.protocol !== 'https:') return undefined
  return `${window.location.origin}/Zelaxy.png`
}

/**
 * Builds the branding/prefill half of the Checkout options, omitting keys we
 * have no value for. checkout.js serialises the options object into a form it
 * POSTs to Razorpay by iterating its own keys, so a key that is merely
 * *present* with an undefined value gets posted as the string "undefined" -
 * which is not the same as leaving it out.
 */
function buildCheckoutBranding(prefillEmail?: string, prefillName?: string) {
  const branding: Record<string, unknown> = { name: 'Zelaxy', theme: { color: BRAND_COLOR } }

  const logoUrl = getBrandLogoUrl()
  if (logoUrl) branding.image = logoUrl

  const prefill: Record<string, string> = {}
  if (prefillEmail) prefill.email = prefillEmail
  if (prefillName) prefill.name = prefillName
  if (Object.keys(prefill).length > 0) branding.prefill = prefill

  return branding
}

async function dismissBlockingOverlays(): Promise<void> {
  window.dispatchEvent(new CustomEvent(CLOSE_OVERLAYS_EVENT))
  // Let the close animation finish so Radix restores pointer-events on
  // <body> and releases its focus trap before the iframe goes in.
  await new Promise((resolve) => setTimeout(resolve, 260))
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
}

/**
 * Belt and braces for the above: an element with `pointer-events: auto`
 * still receives events under a `pointer-events: none` body, so the widget
 * stays clickable even if some overlay didn't close.
 */
function keepCheckoutInteractive(): void {
  window.setTimeout(() => {
    for (const el of document.querySelectorAll<HTMLElement>('.razorpay-container')) {
      el.style.pointerEvents = 'auto'
    }
  }, 300)
}

/**
 * How long to wait for the checkout iframe to show any sign of life before
 * treating it as blocked. Deliberately generous: this used to be 9s, which
 * sounded reasonable against a fast local connection but was long enough to
 * misfire for real users on a slower network or a busier machine, where the
 * iframe was genuinely still loading rather than blocked. Because a false
 * positive here used to force-navigate the customer away from a widget that
 * would have worked fine, it's now only ever a passive fallback offer (see
 * the caller) - so erring toward fewer, later false positives is the safe
 * direction to round this timeout in.
 */
const BLOCKED_CHECKOUT_TIMEOUT_MS = 20000

/**
 * Watches for the checkout iframe reporting in. A checkout that actually runs
 * posts messages to its opener within a second or two on a normal connection;
 * total silence for BLOCKED_CHECKOUT_TIMEOUT_MS means the frame most likely
 * never executed. There is no way to feature-detect an extension or a
 * tracking-prevention rule blocking a third-party payment iframe - the parent
 * page just sees an opaque, permanently blank frame - so absence of chatter is
 * the only signal available, and it's a heuristic, not a certainty.
 */
function createBlockedCheckoutWatchdog(onBlocked: () => void) {
  let sawCheckoutActivity = false

  const onMessage = (event: MessageEvent) => {
    if (typeof event.origin === 'string' && event.origin.endsWith('.razorpay.com')) {
      sawCheckoutActivity = true
    }
  }

  window.addEventListener('message', onMessage)

  const timer = window.setTimeout(() => {
    window.removeEventListener('message', onMessage)
    if (sawCheckoutActivity) return
    logger.warn('Razorpay Checkout never initialised - falling back to the hosted page')
    onBlocked()
  }, BLOCKED_CHECKOUT_TIMEOUT_MS)

  return {
    cancel: () => {
      window.clearTimeout(timer)
      window.removeEventListener('message', onMessage)
    },
  }
}

declare global {
  interface Window {
    Razorpay?: new (
      options: Record<string, unknown>
    ) => {
      open: () => void
      on: (event: string, handler: (response: unknown) => void) => void
    }
  }
}

let scriptLoadPromise: Promise<void> | null = null

function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay Checkout can only be opened in the browser'))
  }
  if (window.Razorpay) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoadPromise = null
      reject(new Error('Failed to load Razorpay Checkout script'))
    }
    document.body.appendChild(script)
  })

  return scriptLoadPromise
}

export interface OpenSubscriptionCheckoutParams {
  plan: 'pro' | 'team'
  referenceId?: string
  seats?: number
  prefillEmail?: string
  prefillName?: string
}

export interface SubscriptionCheckoutResult {
  success: boolean
  error?: string
  /** True when the customer closed the widget without paying - not a failure. */
  dismissed?: boolean
  /** True when the embedded widget never ran and the hosted page should be used. */
  blocked?: boolean
  /**
   * Razorpay's own hosted page for this subscription. Offered as a fallback
   * when the embedded widget can't run - browser extensions, tracking
   * prevention and enterprise policies all block third-party payment iframes,
   * and none of that is visible to us from here.
   */
  hostedUrl?: string
}

/**
 * Where a pending subscription is parked while the customer is away on
 * Razorpay's hosted checkout page. sessionStorage (not localStorage) so it
 * dies with the tab and can't resurrect a long-abandoned attempt.
 */
const PENDING_SUBSCRIPTION_KEY = 'zelaxy.pendingSubscription'

export interface PendingSubscription {
  subscriptionId: string
  plan: 'pro' | 'team'
  returnUrl: string
  startedAt: number
}

export function readPendingSubscription(): PendingSubscription | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(PENDING_SUBSCRIPTION_KEY)
    return raw ? (JSON.parse(raw) as PendingSubscription) : null
  } catch {
    return null
  }
}

export function clearPendingSubscription(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY)
  } catch {
    // sessionStorage can throw in private-mode//embedded contexts - a failed
    // clear only means we re-check a already-synced subscription once.
  }
}

/**
 * Full client-side subscription upgrade: starts a Razorpay subscription via
 * our API, opens Razorpay Checkout for the customer to authorise the
 * recurring mandate, then verifies the payment signature server-side.
 *
 * Uses the Checkout widget rather than Razorpay's hosted subscription page
 * because the widget is the only one of the two we can brand - it takes our
 * name, logo and theme colour, whereas the hosted page is fixed Razorpay
 * chrome showing the Razorpay account's registered business name.
 *
 * The pending subscription is parked in sessionStorage before the widget
 * opens so that a customer who pays and then refreshes (or whose tab is
 * reloaded mid-payment) still has the plan reconciled by
 * resumePendingSubscription on the next load, instead of the payment
 * silently going nowhere.
 */
export async function openRazorpaySubscriptionCheckout(
  params: OpenSubscriptionCheckoutParams
): Promise<SubscriptionCheckoutResult> {
  try {
    const checkoutResponse = await fetch('/api/billing/subscription/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: params.plan,
        referenceId: params.referenceId,
        seats: params.seats,
      }),
    })

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json().catch(() => ({}))
      return { success: false, error: errorData.error || 'Failed to start checkout' }
    }

    const { subscriptionId, shortUrl } = await checkoutResponse.json()

    const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) {
      return { success: false, error: 'Razorpay is not configured for this deployment' }
    }

    await loadRazorpayCheckoutScript()
    if (!window.Razorpay) {
      return {
        success: false,
        error: 'Razorpay Checkout failed to load',
        hostedUrl: shortUrl,
      }
    }

    const pending: PendingSubscription = {
      subscriptionId,
      plan: params.plan,
      returnUrl: `${window.location.pathname}${window.location.search}`,
      startedAt: Date.now(),
    }

    try {
      window.sessionStorage.setItem(PENDING_SUBSCRIPTION_KEY, JSON.stringify(pending))
    } catch {
      // Non-fatal: without the parked state the plan still activates via the
      // subscription.activated webhook, it just won't settle instantly.
    }

    await dismissBlockingOverlays()

    return await new Promise<SubscriptionCheckoutResult>((resolve) => {
      // If the frame never reports in, surface it as an ordinary failure with
      // the hosted page offered as a manual, user-chosen action (new tab) -
      // never navigate the current tab automatically. The widget may simply
      // still be loading, and force-navigating away from a working-but-slow
      // widget is worse than doing nothing: it silently abandons whatever the
      // customer was doing in it.
      const watchdog = createBlockedCheckoutWatchdog(() =>
        resolve({
          success: false,
          blocked: true,
          error: "The payment window didn't load. This can happen with some browser extensions.",
          hostedUrl: shortUrl,
        })
      )

      const settle = (result: SubscriptionCheckoutResult) => {
        watchdog.cancel()
        resolve(result)
      }

      const razorpay = new window.Razorpay!({
        key: keyId,
        subscription_id: subscriptionId,
        description: `${params.plan === 'pro' ? 'Pro' : 'Team'} plan subscription`,
        ...buildCheckoutBranding(params.prefillEmail, params.prefillName),
        handler: async (response: unknown) => {
          const payload = response as {
            razorpay_payment_id: string
            razorpay_subscription_id: string
            razorpay_signature: string
          }
          try {
            const verifyResponse = await fetch('/api/billing/subscription/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json().catch(() => ({}))
              // Leave the parked state in place - the payment did go through,
              // so resumePendingSubscription can still settle it on reload.
              settle({ success: false, error: errorData.error || 'Failed to verify payment' })
              return
            }

            clearPendingSubscription()
            settle({ success: true })
          } catch (error) {
            logger.error('Failed to verify subscription payment', { error })
            settle({ success: false, error: 'Failed to verify payment' })
          }
        },
        modal: {
          ondismiss: () => {
            settle({ success: false, dismissed: true, hostedUrl: shortUrl })
          },
        },
      })

      razorpay.on('payment.failed', (response: unknown) => {
        const failure = response as { error?: { description?: string } }
        logger.error('Razorpay payment failed', { response })
        settle({
          success: false,
          error: failure.error?.description || 'Payment failed',
          hostedUrl: shortUrl,
        })
      })

      razorpay.open()
      keepCheckoutInteractive()
    })
  } catch (error) {
    logger.error('Failed to open subscription checkout', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open checkout',
    }
  }
}

export interface ResumePendingSubscriptionResult {
  activated: boolean
  plan?: 'pro' | 'team'
}

/**
 * Called on app load. If the customer just came back from Razorpay's hosted
 * checkout, asks the server to reconcile that subscription so the new plan
 * shows up immediately. A still-unpaid subscription (they hit back or
 * cancelled) is simply dropped, leaving them on their current plan.
 */
export async function resumePendingSubscription(): Promise<ResumePendingSubscriptionResult> {
  const pending = readPendingSubscription()
  if (!pending?.subscriptionId) return { activated: false }

  try {
    const response = await fetch('/api/billing/subscription/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: pending.subscriptionId }),
    })

    // Leave the parked state alone on a transient failure (a 401 while the
    // session is still settling, a 5xx) - it lives in sessionStorage, so the
    // worst case is one more check later in this tab.
    if (!response.ok) {
      return { activated: false }
    }

    const { activated } = await response.json()

    // Keep the parked state only while the mandate is still genuinely
    // pending, so a customer who steps away mid-payment and returns later
    // in the same tab still gets it picked up.
    if (activated) {
      clearPendingSubscription()
      logger.info('Subscription activated after returning from hosted checkout', {
        plan: pending.plan,
      })
      return { activated: true, plan: pending.plan }
    }

    return { activated: false, plan: pending.plan }
  } catch (error) {
    logger.error('Failed to resume pending subscription', { error })
    return { activated: false }
  }
}

export interface OpenCreditPurchaseParams {
  amountRupees: number
  prefillEmail?: string
  prefillName?: string
}

export interface CreditPurchaseResult {
  success: boolean
  error?: string
}

/**
 * Client-side flow for a one-time prepaid-credits purchase: starts a
 * Razorpay order via our API, opens Checkout in order mode, and lets the
 * payment.captured webhook (not this function) actually credit the
 * balance - this just reports whether the payment itself went through.
 */
export async function openRazorpayCreditPurchaseCheckout(
  params: OpenCreditPurchaseParams
): Promise<CreditPurchaseResult> {
  try {
    const orderResponse = await fetch('/api/billing/credits/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountRupees: params.amountRupees }),
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json().catch(() => ({}))
      return { success: false, error: errorData.error || 'Failed to start credit purchase' }
    }

    const { orderId, amountPaise, keyId } = await orderResponse.json()

    await loadRazorpayCheckoutScript()
    if (!window.Razorpay) {
      return { success: false, error: 'Razorpay Checkout failed to load' }
    }

    await dismissBlockingOverlays()

    return await new Promise<CreditPurchaseResult>((resolve) => {
      const razorpay = new window.Razorpay!({
        key: keyId,
        order_id: orderId,
        amount: amountPaise,
        currency: 'INR',
        description: 'Usage credits',
        ...buildCheckoutBranding(params.prefillEmail, params.prefillName),
        handler: () => {
          resolve({ success: true })
        },
        modal: {
          ondismiss: () => {
            resolve({ success: false, error: 'Checkout was closed before completing payment' })
          },
        },
      })

      razorpay.on('payment.failed', (response: unknown) => {
        const failure = response as { error?: { description?: string } }
        logger.error('Razorpay credit purchase payment failed', { response })
        resolve({ success: false, error: failure.error?.description || 'Payment failed' })
      })

      razorpay.open()
      keepCheckoutInteractive()
    })
  } catch (error) {
    logger.error('Failed to open credit purchase checkout', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open checkout',
    }
  }
}

export interface CancelSubscriptionResult {
  success: boolean
  error?: string
}

/**
 * Cancels the caller's (or, for an owner/admin, their organization's)
 * active Razorpay subscription. Replaces better-auth's Stripe plugin
 * client `subscription.cancel()`.
 */
export async function cancelRazorpaySubscription(
  referenceId?: string,
  cancelAtCycleEnd = true
): Promise<CancelSubscriptionResult> {
  try {
    const response = await fetch('/api/billing/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceId, cancelAtCycleEnd }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { success: false, error: errorData.error || 'Failed to cancel subscription' }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    }
  }
}
