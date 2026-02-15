import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    anthropic: {
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
    },
    google: {
      configured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    },
  })
}
