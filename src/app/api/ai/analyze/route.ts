import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { getAiKey } from '@/lib/ai-keys'

const SYSTEM_PROMPT = [
  'You are a code analysis assistant.',
  'Explain the code, identify potential issues,',
  'and suggest improvements. Be concise.',
].join(' ')

function createClient(token: string): Anthropic {
  if (token.startsWith('sk-ant-oat')) {
    return new Anthropic({ authToken: token })
  }
  return new Anthropic({ apiKey: token })
}

export async function POST(request: Request) {
  const token = await getAiKey('anthropic')
  if (!token) {
    return NextResponse.json(
      { error: 'Claude token not configured' },
      { status: 401 }
    )
  }

  const { text, context } = await request.json()
  const client = createClient(token)

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this code/text:\n\n${text}\n\nContext: ${context || 'none'}`,
      },
    ],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
