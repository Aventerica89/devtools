import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { provider } = await request.json()

  try {
    if (provider === 'anthropic') {
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({
          success: false,
          error: 'ANTHROPIC_API_KEY not configured',
        })
      }
      await generateText({
        model: anthropic('claude-haiku-4-5-20251001'),
        prompt: 'Say "OK"',
        maxOutputTokens: 5,
      })
      return NextResponse.json({
        success: true,
        provider: 'anthropic',
      })
    }

    if (provider === 'google') {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return NextResponse.json({
          success: false,
          error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured',
        })
      }
      await generateText({
        model: google('gemini-2.0-flash'),
        prompt: 'Say "OK"',
        maxOutputTokens: 5,
      })
      return NextResponse.json({
        success: true,
        provider: 'google',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Unknown provider' },
      { status: 400 }
    )
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    })
  }
}
