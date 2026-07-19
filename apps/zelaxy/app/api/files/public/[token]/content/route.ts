import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { evaluateShareGate } from '@/lib/public-shares/share-auth'
import { getShareByToken, getShareFile, isShareExpired } from '@/lib/public-shares/share-manager'
import { downloadFile } from '@/lib/uploads'

const logger = createLogger('PublicShareContentAPI')

export const dynamic = 'force-dynamic'

/**
 * GET /api/files/public/[token]/content
 *
 * Streams the shared file's bytes once the gate is satisfied. Unlike the internal file-serve
 * route, this response is PRIVATE and non-cacheable — a token-gated file must never land in a
 * shared/CDN cache, and revoking a share must take effect immediately.
 */
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

  const gate = evaluateShareGate(request, share)
  if (!gate.authorized) {
    return NextResponse.json(
      { error: 'Authentication required', authRequired: gate.error },
      { status: 401 }
    )
  }

  const file = await getShareFile(share.fileId)
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  let buffer: Buffer
  try {
    buffer = await downloadFile(file.key)
  } catch (error) {
    logger.error('Failed to read shared file from storage', {
      error,
      shareId: share.id,
      key: file.key,
    })
    return NextResponse.json({ error: 'File is no longer available' }, { status: 404 })
  }

  const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline'
  const safeName = encodeURIComponent(file.name)

  return new NextResponse(buffer as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Content-Length': String(buffer.length),
      // Preserve non-ASCII names via RFC 5987; keep an ASCII-ish fallback too.
      'Content-Disposition': `${disposition}; filename="${file.name.replace(/["\\\r\n]/g, '_')}"; filename*=UTF-8''${safeName}`,
      // Token-gated: never cache in shared/CDN caches; revalidate every time.
      'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
