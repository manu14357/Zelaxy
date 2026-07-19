import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { renderOTPEmail } from '@/components/emails/render-email'
import { sendEmail } from '@/lib/email/mailer'
import { createLogger } from '@/lib/logs/console/logger'
import { deleteShareOTP, generateOTP, getShareOTP, storeShareOTP } from '@/lib/public-shares/otp'
import { isEmailAllowed, setShareAuthCookie } from '@/lib/public-shares/share-auth'
import { getShareByToken, getShareFile, isShareExpired } from '@/lib/public-shares/share-manager'

const logger = createLogger('PublicShareOtpAPI')

export const dynamic = 'force-dynamic'

const requestSchema = z.object({ email: z.string().email('Invalid email address') })
const verifySchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'Code must be 6 digits'),
})

// POST — send a one-time code to an allow-listed email for an email-gated share.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const requestId = crypto.randomUUID().slice(0, 8)

  const share = await getShareByToken(token)
  if (!share) return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  if (isShareExpired(share)) {
    return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
  }
  if (share.mode !== 'email') {
    return NextResponse.json(
      { error: 'This share does not use email authentication' },
      { status: 400 }
    )
  }

  let email: string
  try {
    email = requestSchema.parse(await request.json()).email
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message || 'Invalid request'
        : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (!isEmailAllowed(email, share.allowedEmails)) {
    return NextResponse.json({ error: 'Email not authorized for this file' }, { status: 403 })
  }

  const otp = generateOTP()
  await storeShareOTP(email, share.id, otp)

  const file = await getShareFile(share.fileId)
  const label = file?.name || 'Shared file'

  try {
    const html = await renderOTPEmail(otp, email, 'email-verification', label)
    const result = await sendEmail({
      to: email,
      subject: `Verification code for ${label}`,
      html,
    })
    if (!result.success) {
      logger.error(`[${requestId}] Failed to send share OTP email`, { message: result.message })
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }
  } catch (error) {
    logger.error(`[${requestId}] Error sending share OTP email`, { error })
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }

  logger.info(`[${requestId}] Share OTP sent to ${email} for share ${share.id}`)
  return NextResponse.json({ message: 'Verification code sent' })
}

// PUT — verify the code; on success set the passed-gate cookie.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const share = await getShareByToken(token)
  if (!share) return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  if (isShareExpired(share)) {
    return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
  }
  if (share.mode !== 'email') {
    return NextResponse.json(
      { error: 'This share does not use email authentication' },
      { status: 400 }
    )
  }

  let email: string
  let otp: string
  try {
    const parsed = verifySchema.parse(await request.json())
    email = parsed.email
    otp = parsed.otp
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message || 'Invalid request'
        : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Re-check the allow-list at verify time (it may have changed since the code was sent).
  if (!isEmailAllowed(email, share.allowedEmails)) {
    return NextResponse.json({ error: 'Email not authorized for this file' }, { status: 403 })
  }

  const stored = await getShareOTP(email, share.id)
  if (!stored) {
    return NextResponse.json(
      { error: 'No verification code found, request a new one' },
      { status: 400 }
    )
  }
  if (stored !== otp) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
  }

  await deleteShareOTP(email, share.id)

  const response = NextResponse.json({ authenticated: true })
  setShareAuthCookie(response, share)
  return response
}
