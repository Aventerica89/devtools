import Anthropic from '@anthropic-ai/sdk'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { getAiKey } from '@/lib/ai-keys'

function createAnthropicClient(token: string): Anthropic {
  if (token.startsWith('sk-ant-oat')) {
    return new Anthropic({ authToken: token })
  }
  return new Anthropic({ apiKey: token })
}

export async function POST(request: Request) {
  const { provider } = await request.json()

  try {
    if (provider === 'anthropic') {
      const token = await getAiKey('anthropic')
      if (!token) {
        return NextResponse.json({
          success: false,
          error: 'Claude token not configured',
        })
      }
      const client = createAnthropicClient(token)
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Say "OK"' }],
      })
      return NextResponse.json({ success: true, provider: 'anthropic' })
    }

    if (provider === 'google') {
      const apiKey = await getAiKey('google')
      if (!apiKey) {
        return NextResponse.json({
          success: false,
          error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured',
        })
      }
      const client = createGoogleGenerativeAI({ apiKey })
      await generateText({
        model: client('gemini-2.0-flash'),
        prompt: 'Say "OK"',
        maxOutputTokens: 5,
      })
      return NextResponse.json({ success: true, provider: 'google' })
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
