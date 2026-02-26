import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isWidgetRoute = createRouteMatcher([
  '/api/widget/(.*)',
  '/api/bugs(.*)',
  '/api/devlog(.*)',
  '/api/ideas(.*)',
  '/api/ai/(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/unlock(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/clerk-proxy(.*)',
])

/**
 * Get allowed origin for CORS response.
 * For production: validate against widgetConfig.allowedOrigins from database.
 * For now: uses environment variable or wildcard.
 */
function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get('origin')
  const allowedOriginsEnv = process.env.WIDGET_ALLOWED_ORIGINS

  if (!allowedOriginsEnv) {
    // No restrictions configured, allow all (current behavior)
    return '*'
  }

  const allowedOrigins = allowedOriginsEnv.split(',').map(o => o.trim())

  if (origin && allowedOrigins.includes(origin)) {
    return origin
  }

  // Default to first allowed origin or deny
  return allowedOrigins[0] || 'null'
}

export default clerkMiddleware(async (auth, req) => {
  // Allow API key-authenticated requests (CLI, external tools)
  if (isWidgetRoute(req) && req.headers.get('x-devtools-api-key')) {
    return NextResponse.next()
  }

  // Allow widget routes with PIN header (cross-origin)
  if (isWidgetRoute(req) && req.headers.get('x-devtools-pin')) {
    const allowedOrigin = getAllowedOrigin(req)
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-DevTools-Pin')
    response.headers.set('Access-Control-Max-Age', '86400')

    // Only allow credentials if origin is specific (not wildcard)
    if (allowedOrigin !== '*') {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return response
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS' && isWidgetRoute(req)) {
    const allowedOrigin = getAllowedOrigin(req)
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-DevTools-Pin, X-DevTools-Api-Key',
        'Access-Control-Max-Age': '86400',
        ...(allowedOrigin !== '*' && { 'Access-Control-Allow-Credentials': 'true' }),
      },
    })
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Require Clerk auth for all other routes
  await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
