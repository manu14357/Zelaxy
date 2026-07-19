import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import {
  evaluateShareGate,
  setShareAuthCookie,
  verifySharePasswordSubmission,
} from '@/lib/public-shares/share-auth'
import { getShareByToken, getShareFile, isShareExpired } from '@/lib/public-shares/share-manager'

const logger = createLogger('PublicShareAPI')

export const dynamic = 'force-dynamic'

// GET /api/files/public/[token]
// Returns the file metadata + the gate state. For non-public modes without a valid cookie the
// caller learns which challenge to present (auth_required_password | _email | _sso).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const share = await getShareByToken(token)
  if (!share) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }
  if (isShareExpired(share)) {
    return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
  }

  const file = await getShareFile(share.fileId)
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const gate = evaluateShareGate(request, share)

  return NextResponse.json({
    mode: share.mode,
    authorized: gate.authorized,
    // Only surfaced when a challenge is needed.
    ...(gate.authorized ? {} : { authRequired: gate.error }),
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
      category: file.category,
    },
  })
}

const PasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

// POST /api/files/public/[token]
// Submit a password for a password-gated share. On success sets the passed-gate cookie.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const share = await getShareByToken(token)
  if (!share) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }
  if (isShareExpired(share)) {
    return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
  }

  if (share.mode !== 'password') {
    return NextResponse.json(
      { error: 'This share does not use password authentication' },
      { status: 400 }
    )
  }

  let password: string
  try {
    password = PasswordSchema.parse(await request.json()).password
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message || 'Invalid request'
        : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const ok = await verifySharePasswordSubmission(share, password)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
  } catch (error) {
    logger.error('Error verifying share password', { error, shareId: share.id })
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }

  const response = NextResponse.json({ authenticated: true })
  setShareAuthCookie(response, share)
  return response
}
