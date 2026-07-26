import { describe, expect, it } from 'vitest'
import {
  renderBillingReceiptEmail,
  renderPaymentFailedEmail,
  renderPlanWelcomeEmail,
  renderUsageAlertEmail,
} from './render-email'

// Renders each billing template end-to-end so a JSX/prop error surfaces here
// rather than at send time in production.
describe('billing email templates render to HTML', () => {
  it('renders a plan receipt with the formatted total and line items', async () => {
    const html = await renderBillingReceiptEmail({
      name: 'Bob',
      heading: 'Payment received',
      lineItems: [
        { label: 'Plan', value: 'Pro plan' },
        { label: 'Billing period', value: '1 Feb 2026 – 1 Mar 2026' },
      ],
      totalValue: '₹1,999',
    })

    expect(html).toContain('Payment received')
    expect(html).toContain('Pro plan')
    expect(html).toContain('₹1,999')
  })

  it('renders the welcome email with the plan name and getting-started steps', async () => {
    const html = await renderPlanWelcomeEmail({ name: 'Bob', planLabel: 'Pro' })

    expect(html).toContain('Welcome to Zelaxy Pro')
    expect(html).toContain('Build your first workflow')
  })

  it('renders the payment-failed email with the outstanding amount', async () => {
    const html = await renderPaymentFailedEmail({
      name: 'Bob',
      amount: '₹500',
      reason: 'The payment link expired.',
    })

    expect(html).toContain('payment failed')
    expect(html).toContain('₹500')
  })

  it('renders a usage-alert email with the percentage and plan', async () => {
    const html = await renderUsageAlertEmail({ name: 'Bob', planLabel: 'Pro', percent: 80 })
    expect(html).toContain('80%')
    expect(html).toContain('Pro')
  })

  it('renders the 100% usage-alert with limit-reached copy', async () => {
    const html = await renderUsageAlertEmail({ name: 'Bob', planLabel: 'Free', percent: 100 })
    expect(html).toContain('reached your monthly usage limit')
  })
})
