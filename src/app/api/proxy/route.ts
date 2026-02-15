import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const config = await request.json()
  const { method, url, headers, body } = config as {
    method: string
    url: string
    headers: Record<string, string>
    body: string | null
  }

  if (!url) {
    return NextResponse.json(
      { error: 'URL is required' },
      { status: 400 }
    )
  }

  const startTime = performance.now()

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: headers || {},
    }

    const methodsWithBody = ['POST', 'PUT', 'PATCH']
    if (methodsWithBody.includes(method) && body) {
      fetchOptions.body = body
    }

    const response = await fetch(url, fetchOptions)
    const elapsed = Math.round(performance.now() - startTime)

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const contentType = response.headers.get('content-type') || ''
    let responseBody: string

    if (contentType.includes('application/json')) {
      const json = await response.json()
      responseBody = JSON.stringify(json, null, 2)
    } else {
      responseBody = await response.text()
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      timing: elapsed,
    })
  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime)
    const message =
      error instanceof Error ? error.message : 'Request failed'

    return NextResponse.json({
      status: 0,
      statusText: 'Network Error',
      headers: {},
      body: message,
      timing: elapsed,
    })
  }
}
