import { type NextRequest, NextResponse } from 'next/server'

const MAINTENANCE_PASSWORD = process.env.MAINTENANCE_PASSWORD?.trim()
const MAINTENANCE_COOKIE = 'docs_maintenance_access'

function sanitizeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith('/')) return '/'
  if (nextPath.startsWith('//')) return '/'
  if (nextPath.startsWith('/maintenance')) return '/'
  return nextPath
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const password = String(formData.get('password') || '')
  const nextPath = sanitizeNextPath(String(formData.get('next') || '/'))
  const origin = request.nextUrl.origin

  if (!MAINTENANCE_PASSWORD) {
    const url = new URL('/maintenance', origin)
    url.searchParams.set('error', 'config')
    url.searchParams.set('next', nextPath)
    return NextResponse.redirect(url)
  }

  if (password !== MAINTENANCE_PASSWORD) {
    const url = new URL('/maintenance', origin)
    url.searchParams.set('error', 'invalid')
    url.searchParams.set('next', nextPath)
    return NextResponse.redirect(url)
  }

  const response = NextResponse.redirect(new URL(nextPath, origin))
  response.cookies.set(MAINTENANCE_COOKIE, 'granted', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return response
}
