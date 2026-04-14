import { type NextRequest, NextResponse } from 'next/server'

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true'
const MAINTENANCE_COOKIE = 'docs_maintenance_access'

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname
  const isAllowedPath =
    pathname === '/maintenance' || pathname.startsWith('/api/maintenance/unlock')
  const hasMaintenanceAccess = request.cookies.get(MAINTENANCE_COOKIE)?.value === 'granted'

  if (!hasMaintenanceAccess && !isAllowedPath) {
    const maintenanceUrl = request.nextUrl.clone()
    maintenanceUrl.pathname = '/maintenance'
    maintenanceUrl.search = ''
    maintenanceUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(maintenanceUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|eot|css|js|map)).*)',
  ],
}
