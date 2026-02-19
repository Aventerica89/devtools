import { NextRequest, NextResponse } from 'next/server'

const CLERK_API = 'https://frontend-api.clerk.dev'
const PROXY_URL = 'https://devtools.jbcloud.app/clerk-proxy'

async function proxyToClerk(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params
  const url = new URL(request.url)
  const destination = `${CLERK_API}/${path.join('/')}${url.search}`

  const headers = new Headers(request.headers)
  headers.set('Clerk-Proxy-Url', PROXY_URL)
  headers.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY!)
  headers.set('X-Forwarded-For', request.headers.get('x-forwarded-for') ?? '')
  headers.delete('host')

  const response = await fetch(destination, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    // @ts-expect-error duplex required for streaming body
    duplex: 'half',
    // Don't follow redirects — Clerk's oauth_callback returns a 302 to the app.
    // If we follow it internally, the browser never receives the redirect and the
    // OAuth session cookies are not set correctly on the app domain.
    redirect: 'manual',
  })

  const responseHeaders = new Headers(response.headers)
  // fetch() auto-decompresses the body, so strip encoding headers
  // to avoid ERR_CONTENT_DECODING_FAILED in the browser
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')
  responseHeaders.delete('transfer-encoding')

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToClerk(request, params)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToClerk(request, params)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToClerk(request, params)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToClerk(request, params)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToClerk(request, params)
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToClerk(request, params)
}
