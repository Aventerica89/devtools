import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const SYSTEM_PROMPT = [
  'You are a code analysis assistant.',
  'Explain the code, identify potential issues,',
  'and suggest improvements. Be concise.',
].join(' ')

export async function POST(request: Request) {
  const { text, context } = await request.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    system: SYSTEM_PROMPT,
    prompt: `Analyze this code/text:\n\n${text}\n\nContext: ${context || 'none'}`,
  })

  return result.toTextStreamResponse()
}
