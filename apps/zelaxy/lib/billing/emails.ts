import { eq } from 'drizzle-orm'
import {
  renderBillingReceiptEmail,
  renderPaymentFailedEmail,
  renderPlanWelcomeEmail,
  renderUsageAlertEmail,
} from '@/components/emails/render-email'
import { sendEmail } from '@/lib/email/mailer'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { user as userTable } from '@/db/schema'

const logger = createLogger('BillingEmails')

function formatInr(amount: number): string {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount)}`
}

function planLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

async function resolveRecipient(userId: string): Promise<{ email: string; name: string } | null> {
  try {
    const rows = await db
      .select({ email: userTable.email, name: userTable.name })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1)
    if (rows.length === 0 || !rows[0].email) return null
    return { email: rows[0].email, name: rows[0].name || 'there' }
  } catch (error) {
    logger.error('Failed to resolve email recipient', { userId, error })
    return null
  }
}

/**
 * All billing emails are best-effort: a send failure must never break the
 * payment-success flow that triggers it (the plan is already active / credits
 * already granted by the time these run). Callers gate these on their own
 * idempotency signal (invoiceRecorded / recordInvoice.created / first
 * activation) so they fire once per event, not once per delivery.
 */
export async function sendPlanReceiptEmail(
  userId: string,
  params: {
    plan: string
    amountInr: number
    seats: number
    periodStart?: Date | null
    periodEnd?: Date | null
  }
): Promise<void> {
  const recipient = await resolveRecipient(userId)
  if (!recipient) return

  const lineItems = [{ label: 'Plan', value: `${planLabel(params.plan)} plan` }]
  if (params.seats > 1) lineItems.push({ label: 'Seats', value: String(params.seats) })
  if (params.periodStart && params.periodEnd) {
    lineItems.push({
      label: 'Billing period',
      value: `${formatDate(params.periodStart)} – ${formatDate(params.periodEnd)}`,
    })
  }

  try {
    const html = await renderBillingReceiptEmail({
      name: recipient.name,
      heading: 'Payment received',
      intro: `Thanks — your payment for the ${planLabel(params.plan)} plan was received.`,
      lineItems,
      totalLabel: 'Total paid',
      totalValue: formatInr(params.amountInr),
    })
    await sendEmail({
      to: recipient.email,
      subject: `Your Zelaxy ${planLabel(params.plan)} receipt`,
      html,
      emailType: 'transactional',
    })
  } catch (error) {
    logger.error('Failed to send plan receipt email', { userId, error })
  }
}

export async function sendPlanWelcomeEmail(
  userId: string,
  params: { plan: string }
): Promise<void> {
  const recipient = await resolveRecipient(userId)
  if (!recipient) return

  try {
    const html = await renderPlanWelcomeEmail({
      name: recipient.name,
      planLabel: planLabel(params.plan),
    })
    await sendEmail({
      to: recipient.email,
      subject: `Welcome to Zelaxy ${planLabel(params.plan)}`,
      html,
      emailType: 'transactional',
    })
  } catch (error) {
    logger.error('Failed to send plan welcome email', { userId, error })
  }
}

export async function sendCreditReceiptEmail(
  userId: string,
  params: { amountRupees: number; creditUnits: number }
): Promise<void> {
  const recipient = await resolveRecipient(userId)
  if (!recipient) return

  try {
    const html = await renderBillingReceiptEmail({
      name: recipient.name,
      heading: 'Credits added',
      intro: 'Your prepaid credit purchase is complete.',
      lineItems: [
        { label: 'Amount paid', value: formatInr(params.amountRupees) },
        { label: 'Credits added', value: `$${params.creditUnits.toFixed(2)}` },
      ],
      totalLabel: 'Total paid',
      totalValue: formatInr(params.amountRupees),
      footnote: 'Credits are applied automatically against usage overage before any payment link.',
    })
    await sendEmail({
      to: recipient.email,
      subject: 'Your Zelaxy credit purchase receipt',
      html,
      emailType: 'transactional',
    })
  } catch (error) {
    logger.error('Failed to send credit receipt email', { userId, error })
  }
}

export async function sendUsageAlertEmail(
  userId: string,
  params: { planLabel: string; percent: number; used?: number; limit?: number }
): Promise<void> {
  const recipient = await resolveRecipient(userId)
  if (!recipient) return

  try {
    const html = await renderUsageAlertEmail({
      name: recipient.name,
      planLabel: params.planLabel,
      percent: params.percent,
      usedLabel: params.used !== undefined ? `$${params.used.toFixed(2)}` : undefined,
      limitLabel: params.limit !== undefined ? `$${params.limit.toFixed(2)}` : undefined,
    })
    await sendEmail({
      to: recipient.email,
      subject:
        params.percent >= 100
          ? "You've reached your Zelaxy usage limit"
          : `You've used ${params.percent}% of your Zelaxy usage`,
      html,
      emailType: 'transactional',
    })
  } catch (error) {
    logger.error('Failed to send usage-alert email', { userId, error })
  }
}

export async function sendPaymentFailedNotice(
  userId: string,
  params: { amountInr?: number; reason?: string }
): Promise<void> {
  const recipient = await resolveRecipient(userId)
  if (!recipient) return

  try {
    const html = await renderPaymentFailedEmail({
      name: recipient.name,
      amount: params.amountInr !== undefined ? formatInr(params.amountInr) : undefined,
      reason: params.reason,
    })
    await sendEmail({
      to: recipient.email,
      subject: 'Action required: a payment on your Zelaxy account failed',
      html,
      emailType: 'transactional',
    })
  } catch (error) {
    logger.error('Failed to send payment-failed email', { userId, error })
  }
}
