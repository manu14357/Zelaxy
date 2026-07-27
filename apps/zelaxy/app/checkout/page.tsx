import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { isRazorpaySubscriptionPlan } from '@/lib/billing/razorpay-pricing'
import { isBillingEnabled } from '@/lib/environment'
import { CheckoutLauncher } from '@/app/checkout/checkout-launcher'

export const dynamic = 'force-dynamic'

/**
 * /checkout?plan=pro — the single entry point for "I want to buy this plan",
 * used by the public pricing page.
 *
 * Previously the pricing CTAs pointed straight at /signup?plan=pro, but no
 * auth screen ever read `plan`, so the purchase intent was dropped on the
 * floor: a signed-out visitor landed on signup and an already-signed-in one
 * was shown a signup form for an account they already had - both ending on
 * the canvas with nothing bought.
 *
 * This resolves the two cases explicitly, server-side, before any of that:
 *  - signed out -> /login carrying this same URL as callbackUrl, so the
 *    intent survives the round trip and lands back here once authenticated
 *  - signed in  -> opens Checkout right here (see CheckoutLauncher), then
 *    enters the app once it settles
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams

  // An unknown/absent plan has nothing to buy - show the menu rather than
  // dropping the visitor somewhere arbitrary.
  if (!plan || !isRazorpaySubscriptionPlan(plan) || !isBillingEnabled) {
    redirect('/pricing')
  }

  const session = await getSession()

  if (!session?.user?.id) {
    // Round-trips back to this same route, so the plan choice survives login
    // (and the signup detour, since the login page forwards callbackUrl on).
    const callbackUrl = encodeURIComponent(`/checkout?plan=${plan}`)
    redirect(`/login?callbackUrl=${callbackUrl}`)
  }

  return (
    <CheckoutLauncher
      plan={plan}
      email={session.user.email ?? undefined}
      name={session.user.name ?? undefined}
    />
  )
}
