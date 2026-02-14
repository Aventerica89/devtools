import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyPin, createSessionToken } from '@/lib/auth'

export async function POST(request: Request) {
  const { pin } = await request.json()
  const storedHash = process.env.DEVTOOLS_PIN_HASH

  if (!storedHash) {
    return NextResponse.json(
      { error: 'PIN not configured' },
      { status: 500 }
    )
  }

  const valid = await verifyPin(pin, storedHash)
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid PIN' },
      { status: 401 }
    )
  }

  const token = createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set('devtools-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return NextResponse.json({ success: true })
}
