import { NextResponse } from 'next/server'
import { getAiKey } from '@/lib/ai-keys'

export async function GET() {
  const [anthropicKey, googleKey] = await Promise.all([
    getAiKey('anthropic'),
    getAiKey('google'),
  ])

  return NextResponse.json({
    anthropic: { configured: Boolean(anthropicKey) },
    google: { configured: Boolean(googleKey) },
  })
}
