/**
 * Renders every Zelaxy billing email and (a) writes an HTML preview to a temp
 * folder and (b) sends it via the real mailer. Run from apps/zelaxy so bun
 * auto-loads .env (RESEND_API_KEY + EMAIL_DOMAIN):
 *
 *   bun run scripts/send-test-billing-emails.ts [recipient@example.com]
 *
 * Default recipient is manoharchoppa6@gmail.com. Real inbound delivery to an
 * arbitrary address requires EMAIL_DOMAIN (zelaxy.in) to be a verified sending
 * domain in the Resend account behind the key; otherwise Resend returns an
 * error, which this script prints per-email. The HTML previews are written
 * regardless so the emails can always be inspected.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  renderBillingReceiptEmail,
  renderPaymentFailedEmail,
  renderPlanWelcomeEmail,
  renderUsageAlertEmail,
} from '@/components/emails/render-email'
import { sendEmail } from '@/lib/email/mailer'

const TO = process.argv[2] || 'manoharchoppa6@gmail.com'
const NAME = 'Manohar'
const PREVIEW_DIR = join(tmpdir(), 'zelaxy-email-previews')

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function build() {
  return [
    {
      key: 'welcome',
      subject: 'Welcome to Zelaxy Pro',
      html: await renderPlanWelcomeEmail({ name: NAME, planLabel: 'Pro' }),
    },
    {
      key: 'plan-receipt',
      subject: 'Your Zelaxy Pro receipt',
      html: await renderBillingReceiptEmail({
        name: NAME,
        heading: 'Payment received',
        intro: 'Thanks — your payment for the Pro plan was received.',
        lineItems: [
          { label: 'Plan', value: 'Pro plan' },
          { label: 'Billing period', value: '1 Aug 2026 – 1 Sep 2026' },
        ],
        totalLabel: 'Total paid',
        totalValue: '₹1,999',
      }),
    },
    {
      key: 'credit-receipt',
      subject: 'Your Zelaxy credit purchase receipt',
      html: await renderBillingReceiptEmail({
        name: NAME,
        heading: 'Credits added',
        intro: 'Your prepaid credit purchase is complete.',
        lineItems: [
          { label: 'Amount paid', value: '₹830' },
          { label: 'Credits added', value: '$10.00' },
        ],
        totalLabel: 'Total paid',
        totalValue: '₹830',
        footnote:
          'Credits are applied automatically against usage overage before any payment link.',
      }),
    },
    {
      key: 'payment-failed',
      subject: 'Action required: a payment on your Zelaxy account failed',
      html: await renderPaymentFailedEmail({
        name: NAME,
        amount: '₹1,999',
        reason:
          'An automatic charge for your Zelaxy subscription could not be collected. Your account access is on hold until this is resolved.',
      }),
    },
    {
      key: 'usage-alert-50',
      subject: "You've used 50% of your monthly usage",
      html: await renderUsageAlertEmail({ name: NAME, planLabel: 'Pro', percent: 50 }),
    },
    {
      key: 'usage-alert-80',
      subject: "You've used 80% of your monthly usage",
      html: await renderUsageAlertEmail({ name: NAME, planLabel: 'Pro', percent: 80 }),
    },
    {
      key: 'usage-alert-100',
      subject: "You've reached your monthly usage limit",
      html: await renderUsageAlertEmail({ name: NAME, planLabel: 'Free', percent: 100 }),
    },
  ]
}

async function main() {
  mkdirSync(PREVIEW_DIR, { recursive: true })
  const emails = await build()
  console.log(`Sending ${emails.length} test emails to ${TO}`)
  console.log(`Previews: ${PREVIEW_DIR}\n`)

  for (const e of emails) {
    const file = join(PREVIEW_DIR, `${e.key}.html`)
    writeFileSync(file, e.html, 'utf8')
    const res = await sendEmail({
      to: TO,
      subject: e.subject,
      html: e.html,
      emailType: 'transactional',
    })
    const id = (res.data as { id?: string } | undefined)?.id
    console.log(
      `[${e.key.padEnd(16)}] send: ${res.success ? 'OK  ' : 'FAIL'} | ${res.message}${id ? ` | id=${id}` : ''}`
    )
    await delay(700) // stay under Resend's rate limit
  }
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
