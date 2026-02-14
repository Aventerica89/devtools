import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionTokenEdge } from '@/lib/auth.edge'

const PUBLIC_PATHS = ['/unlock', '/api/auth/verify', '/widget.js']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Allow widget API calls with PIN header
  if (pathname.startsWith('/api/widget') || pathname.startsWith('/api/bugs')) {
    const pinHeader = request.headers.get('x-devtools-pin')
    if (pinHeader) return NextResponse.next()
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
