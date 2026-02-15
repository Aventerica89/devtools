import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionTokenEdge } from '@/lib/auth.edge'

const PUBLIC_PATHS = ['/unlock', '/api/auth/verify', '/widget.js']

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-DevTools-Pin',
  'Access-Control-Max-Age': '86400',
} as const

function isWidgetPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/widget') ||
    pathname.startsWith('/api/bugs') ||
    pathname.startsWith('/api/ai')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CORS preflight for widget endpoints (cross-origin script tags)
  if (isWidgetPath(pathname) && request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
  }

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Allow widget API calls with PIN header and add CORS to response
  if (isWidgetPath(pathname)) {
    const pinHeader = request.headers.get('x-devtools-pin')
    if (pinHeader) {
      const response = NextResponse.next()
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        response.headers.set(key, value)
      }
      return response
    }
  }

  // Check session cookie for dashboard
  const session = request.cookies.get('devtools-session')?.value
  if (!session || !(await verifySessionTokenEdge(session))) {
    return NextResponse.redirect(new URL('/unlock', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
