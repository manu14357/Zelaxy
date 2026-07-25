import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * Legacy alias for `/api/arenas/invitations/accept`.
 *
 * This route used to contain a byte-for-byte duplicate of the arenas accept handler (a
 * relic of the pre-rebrand `/workspace` naming, mirroring the `/workspace` -> `/arena`
 * page-route aliasing already done in middleware.ts). It has no real callers left in the
 * codebase, but invitation emails sent before this cleanup may still contain links pointing
 * here, so instead of a hard 404 we forward to the invite page the same way the arenas
 * route does for an unauthenticated visitor — the invite page performs the actual accept
 * call against the current `/api/arenas/invitations/accept` JSON API.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/'

  if (!token) {
    return NextResponse.redirect(new URL('/invite/invite-error?reason=missing-token', baseUrl))
  }

  return NextResponse.redirect(new URL(`/invite/${token}?token=${token}`, baseUrl))
}
