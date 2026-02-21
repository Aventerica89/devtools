import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-DevTools-Pin',
  'Access-Control-Max-Age': '86400',
} as const

const isWidgetRoute = createRouteMatcher([
  '/api/widget(.*)',
  '/api/bugs(.*)',
  '/api/ai(.*)',
  '/api/routines(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/widget.js',
])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  // CORS preflight for widget routes (cross-origin script embeds)
  if (isWidgetRoute(request) && request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
  }

  // Widget routes with PIN header bypass Clerk (cross-origin can't use Clerk)
  if (isWidgetRoute(request)) {
    const pinHeader = request.headers.get('x-devtools-pin')
    if (pinHeader) {
      const response = NextResponse.next()
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        response.headers.set(key, value)
      }
      return response
    }
  }

  // Skip Clerk for static assets and explicitly public routes
  if (isPublicRoute(request)) return NextResponse.next()

  // Skip for _next internals (redundant with matcher but safe)
  if (pathname.startsWith('/_next')) return NextResponse.next()

  // Require Clerk authentication for all other routes
  await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and Clerk proxy path
    '/((?!_next|clerk-proxy|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
