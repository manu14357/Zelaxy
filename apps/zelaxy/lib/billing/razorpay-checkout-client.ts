'use client'

import { toast } from 'sonner'
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

/**
 * Turns Razorpay's failure copy into something a Zelaxy customer can act on.
 *
 * Razorpay writes its `description` for the *merchant's* own support desk -
 * "contact our support team" means Razorpay's, which reads as nonsense inside
 * our checkout - and a couple of the `source: "business"` reasons are really
 * merchant account configuration rather than anything the customer did wrong.
 * Anything unrecognised is passed through untouched, since Razorpay's card
 * decline messages are already clear and rewriting them would lose detail.
 */
function describePaymentFailure(error?: { description?: string; reason?: string }): string {
  switch (error?.reason) {
    case 'international_transaction_not_allowed':
      return 'That card was issued outside India, which this account cannot charge yet. Please use an Indian card.'
    case 'recurring_payment_not_enabled':
      return 'Automatic monthly billing is not available on this account yet.'
    default:
      return error?.description || 'Payment failed'
  }
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
 * How long to wait before offering a manual way out of a checkout that may
 * be stuck. Not a detector - see below for why one isn't possible here.
 */
const STUCK_CHECKOUT_NUDGE_MS = 8000

/**
 * A last-resort escape hatch, not a detector.
 *
 * The long-standing "blank checkout on the first try, fine after a hard
 * refresh" bug was NOT what this guards against - that was ours:
 * Cross-Origin-Embedder-Policy: credentialless on the app's own responses,
 * which the browser inherits into nested documents and which therefore
 * blocked Razorpay's cross-origin iframe outright (ERR_BLOCKED_BY_RESPONSE,
 * painted as "api.razorpay.com refused to connect"). Because a client-side
 * route change keeps the document it started on, the policy that applied
 * was whichever page the visitor first loaded, and only a hard reload
 * re-fetched headers - hence the misleading "reload fixes it". Fixed in
 * next.config.ts by not asking for cross-origin isolation anywhere.
 *
 * What remains is genuine third-party blocking: an ad blocker or enterprise
 * proxy that filters api.razorpay.com. That can't be detected from here.
 * Two attempts were made and both disproven by direct reproduction:
 *
 *  - postMessage activity: the widget can complete an early handshake with
 *    its opener - so it "chats" - and then stall before the form ever
 *    paints.
 *  - iframe geometry: checkout.js sizes its `<iframe>` via its own CSS the
 *    instant the element is created, before the navigation inside it even
 *    starts, so a blocked frame and a working one report identical
 *    bounding boxes. Reading what actually loaded inside is barred by
 *    same-origin policy - a browser guarantee, not a gap in this code.
 *
 * So this detects nothing. It offers the hosted page after a fixed delay,
 * cancelled the moment the flow settles through any real Razorpay signal
 * (payment succeeded, modal dismissed, payment.failed). When checkout is
 * working the toast is either never seen or is an ignorable option beside
 * a plainly usable widget.
 */
function scheduleStuckCheckoutNudge(hostedUrl?: string) {
  const timer = window.setTimeout(() => {
    toast.info("Payment window not showing up? It's sometimes blocked by a browser extension.", {
      action: hostedUrl
        ? {
            label: 'Open payment page',
            onClick: () => window.open(hostedUrl, '_blank', 'noopener'),
          }
        : undefined,
      duration: 15000,
    })
  }, STUCK_CHECKOUT_NUDGE_MS)

  return {
    cancel: () => window.clearTimeout(timer),
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
  /**
   * True when Razorpay refused the recurring mandate because the merchant
   * account isn't approved for it - recoverable by buying the month outright.
   */
  recurringRefused?: boolean
  /**
   * Which billing mode actually completed. 'order' means a single month was
   * bought with no mandate behind it, so nothing will auto-renew.
   */
  mode?: 'subscription' | 'order'
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

/**
 * Query param stamped onto the current URL for as long as Checkout is open.
 * The widget itself is a same-page overlay with no navigation of its own -
 * without this the address bar visibly doesn't change while a payment is in
 * progress, which reads as broken even though the widget is working. This is
 * cosmetic (a plain history.pushState, not a Next.js route change - nothing
 * re-renders because of it) but it also means the subscription id survives a
 * hard refresh even in the rare case sessionStorage doesn't (private mode,
 * or the pending record already being cleared), giving resumePendingSubscription
 * a second, independent way to find it.
 */
const CHECKOUT_URL_PARAM = 'checkout'

function setCheckoutUrlParam(subscriptionId: string): void {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set(CHECKOUT_URL_PARAM, subscriptionId)
    window.history.pushState(null, '', url)
  } catch {
    // Purely cosmetic - a failure here just means the URL doesn't reflect
    // the in-progress checkout, the checkout itself is unaffected.
  }
}

function clearCheckoutUrlParam(): void {
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(CHECKOUT_URL_PARAM)) return
    url.searchParams.delete(CHECKOUT_URL_PARAM)
    window.history.replaceState(null, '', url)
  } catch {
    // no-op - see setCheckoutUrlParam
  }
}

function readCheckoutUrlParam(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return new URL(window.location.href).searchParams.get(CHECKOUT_URL_PARAM)
  } catch {
    return null
  }
}

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
    const checkout = await startCheckout(params, false)
    if ('error' in checkout) return { success: false, error: checkout.error }

    const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) {
      return { success: false, error: 'Razorpay is not configured for this deployment' }
    }

    await loadRazorpayCheckoutScript()
    if (!window.Razorpay) {
      return {
        success: false,
        error: 'Razorpay Checkout failed to load',
        hostedUrl: checkout.shortUrl,
      }
    }

    const pending: PendingSubscription = {
      subscriptionId: checkout.subscriptionId || checkout.orderId || '',
      plan: params.plan,
      returnUrl: `${window.location.pathname}${window.location.search}`,
      startedAt: Date.now(),
    }

    try {
      window.sessionStorage.setItem(PENDING_SUBSCRIPTION_KEY, JSON.stringify(pending))
    } catch {
      // Non-fatal: without the parked state the plan still activates via the
      // webhook, it just won't settle instantly.
    }

    const result = await openSubscriptionCheckoutWidget({
      keyId,
      checkout,
      plan: params.plan,
      prefillEmail: params.prefillEmail,
      prefillName: params.prefillName,
    })

    // Whether the merchant may take a recurring mandate is only knowable at
    // payment time: creating the subscription succeeds, then Razorpay
    // refuses the authorisation. Rather than dead-end the customer, buy the
    // month outright instead - same price, same plan, just no auto-renewal.
    if (!result.success && result.recurringRefused) {
      logger.warn('Recurring mandate refused by Razorpay, retrying as a one-time payment')
      const oneTime = await startCheckout(params, true)
      if ('error' in oneTime) return { success: false, error: oneTime.error }

      return await openSubscriptionCheckoutWidget({
        keyId,
        checkout: oneTime,
        plan: params.plan,
        prefillEmail: params.prefillEmail,
        prefillName: params.prefillName,
      })
    }

    return result
  } catch (error) {
    logger.error('Failed to open subscription checkout', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open checkout',
    }
  }
}

/** What the checkout endpoint decided this upgrade should be. */
export interface StartedCheckout {
  mode: 'subscription' | 'order'
  subscriptionId?: string
  orderId?: string
  amountPaise?: number
  amountRupees?: number
  shortUrl?: string
}

interface OpenCheckoutWidgetParams {
  keyId: string
  checkout: StartedCheckout
  plan: 'pro' | 'team'
  prefillEmail?: string
  prefillName?: string
}

/**
 * Asks the server to start an upgrade. It prefers an auto-debiting
 * subscription and falls back to a one-time order when the Razorpay account
 * can't do recurring; `forceOneTime` skips straight to the order.
 */
async function startCheckout(
  params: OpenSubscriptionCheckoutParams,
  forceOneTime: boolean
): Promise<StartedCheckout | { error: string }> {
  const response = await fetch('/api/billing/subscription/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: params.plan,
      referenceId: params.referenceId,
      seats: params.seats,
      forceOneTime,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    return { error: errorData.error || 'Failed to start checkout' }
  }

  return (await response.json()) as StartedCheckout
}

/**
 * Opens Razorpay Checkout for an already-created subscription and resolves
 * once the flow settles. Split out from openRazorpaySubscriptionCheckout so a
 * checkout interrupted by a page reload can be reopened against the *same*
 * Razorpay subscription, rather than abandoning it and creating another one
 * for the same intent.
 */
async function openSubscriptionCheckoutWidget(
  params: OpenCheckoutWidgetParams
): Promise<SubscriptionCheckoutResult> {
  const { keyId, checkout, plan } = params
  const { shortUrl } = checkout
  const razorpayId = checkout.subscriptionId || checkout.orderId || ''

  setCheckoutUrlParam(razorpayId)
  await dismissBlockingOverlays()

  return await new Promise<SubscriptionCheckoutResult>((resolve) => {
    const settle = (result: SubscriptionCheckoutResult) => {
      nudge.cancel()
      clearCheckoutUrlParam()
      resolve(result)
    }

    // Never auto-resolves anything - see scheduleStuckCheckoutNudge for why
    // detecting a broken widget isn't possible here. This purely offers a
    // manual way out after a delay; the flow keeps waiting for a real signal
    // from Razorpay (payment, dismiss, or failure) regardless.
    const nudge = scheduleStuckCheckoutNudge(shortUrl)

    const razorpay = new window.Razorpay!({
      key: keyId,
      // Exactly one of these is set - subscription_id opens Checkout in
      // mandate mode, order_id in one-time mode.
      ...(checkout.mode === 'subscription'
        ? { subscription_id: checkout.subscriptionId }
        : { order_id: checkout.orderId, amount: checkout.amountPaise, currency: 'INR' }),
      description:
        checkout.mode === 'subscription'
          ? `${plan === 'pro' ? 'Pro' : 'Team'} plan subscription`
          : `${plan === 'pro' ? 'Pro' : 'Team'} plan — 1 month`,
      ...buildCheckoutBranding(params.prefillEmail, params.prefillName),
      handler: async (response: unknown) => {
        const payload = response as {
          razorpay_payment_id: string
          razorpay_subscription_id?: string
          razorpay_order_id?: string
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
          settle({ success: true, mode: checkout.mode })
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
      const failure = response as { error?: { description?: string; reason?: string } }
      logger.error('Razorpay payment failed', { response })
      settle({
        success: false,
        error: describePaymentFailure(failure.error),
        // Razorpay refuses the mandate at payment time on accounts without
        // Recurring Payments; the caller retries the month as a one-off.
        recurringRefused:
          checkout.mode === 'subscription' &&
          failure.error?.reason === 'recurring_payment_not_enabled',
        hostedUrl: shortUrl,
      })
    })

    razorpay.open()
    keepCheckoutInteractive()
  })
}

export interface ResumePendingSubscriptionResult {
  activated: boolean
  plan?: 'pro' | 'team'
  /** True when an interrupted checkout was reopened for the customer. */
  resumed?: boolean
}

/**
 * Called on app load, and the reason a reload mid-payment isn't a dead end.
 *
 * Razorpay leaves a subscription in `created` until its authorisation payment
 * succeeds, so an interrupted checkout is still payable afterwards. This
 * looks up whichever subscription was in flight - from sessionStorage, or
 * from the `?checkout=` URL param, which survives even where sessionStorage
 * doesn't - and then either settles it (already paid, e.g. paid then
 * reloaded) or reopens Checkout against that same subscription. Without this
 * a reload dropped the customer back on the canvas with the payment silently
 * abandoned, and a retry would mint a second subscription for one intent.
 *
 * What still cannot survive a reload is anything already typed into the card
 * fields: those live in Razorpay's cross-origin iframe and are deliberately
 * non-persistent for PCI reasons, as in every card widget.
 */
export async function resumePendingSubscription(): Promise<ResumePendingSubscriptionResult> {
  const pending = readPendingSubscription()
  const subscriptionId = pending?.subscriptionId || readCheckoutUrlParam()
  if (!subscriptionId) return { activated: false }

  try {
    const response = await fetch('/api/billing/subscription/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    })

    // Leave the parked state alone on a transient failure (a 401 while the
    // session is still settling, a 5xx) - it lives in sessionStorage, so the
    // worst case is one more check later in this tab.
    if (!response.ok) {
      return { activated: false }
    }

    const {
      activated,
      plan: syncedPlan,
      resumable,
      shortUrl,
      mode,
      amountPaise,
    } = (await response.json()) as {
      activated: boolean
      plan?: 'pro' | 'team'
      resumable?: boolean
      shortUrl?: string
      mode?: 'subscription' | 'order'
      amountPaise?: number
    }
    const plan = syncedPlan || pending?.plan

    if (activated) {
      clearPendingSubscription()
      clearCheckoutUrlParam()
      logger.info('Pending subscription settled on load', { plan })
      return { activated: true, plan }
    }

    // Still payable - put the customer back where they were, in whichever
    // mode the interrupted attempt had actually started in.
    const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (resumable && plan && keyId) {
      await loadRazorpayCheckoutScript()
      if (window.Razorpay) {
        logger.info('Reopening interrupted checkout', { razorpayId: subscriptionId, mode, plan })
        const result = await openSubscriptionCheckoutWidget({
          keyId,
          checkout:
            mode === 'order'
              ? { mode: 'order', orderId: subscriptionId, amountPaise }
              : { mode: 'subscription', subscriptionId, shortUrl },
          plan,
        })
        // Either way the customer has now had their chance at this one, so
        // stop tracking it - otherwise dismissing the reopened widget would
        // just have it reappear on every subsequent reload. The
        // subscription.activated webhook still covers the case where they
        // did pay and something went wrong locally.
        clearPendingSubscription()
        return { activated: result.success, plan, resumed: true }
      }
    }

    // Dead (cancelled/expired) or not resumable - stop tracking it.
    clearPendingSubscription()
    clearCheckoutUrlParam()
    return { activated: false, plan }
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
      // Orders (unlike Subscriptions) have no hosted page to fall back to,
      // so this is purely informational - see scheduleStuckCheckoutNudge for
      // why a widget that never renders can't be reliably detected at all.
      const nudge = scheduleStuckCheckoutNudge()
      const settle = (result: CreditPurchaseResult) => {
        nudge.cancel()
        resolve(result)
      }

      const razorpay = new window.Razorpay!({
        key: keyId,
        order_id: orderId,
        amount: amountPaise,
        currency: 'INR',
        description: 'Usage credits',
        ...buildCheckoutBranding(params.prefillEmail, params.prefillName),
        handler: () => {
          settle({ success: true })
        },
        modal: {
          ondismiss: () => {
            settle({ success: false, error: 'Checkout was closed before completing payment' })
          },
        },
      })

      razorpay.on('payment.failed', (response: unknown) => {
        const failure = response as { error?: { description?: string } }
        logger.error('Razorpay credit purchase payment failed', { response })
        settle({ success: false, error: failure.error?.description || 'Payment failed' })
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
