import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const SYSTEM_PROMPT = [
  'You are a debugging assistant.',
  'Explain the error in plain English,',
  'identify the likely root cause,',
  'and suggest a fix. Be concise and actionable.',
].join(' ')

export async function POST(request: Request) {
  const { error, stack, context } = await request.json()

  const prompt = [
    `Error: ${error}`,
    '',
    `Stack trace:\n${stack || 'none'}`,
    '',
    `Context: ${context || 'none'}`,
  ].join('\n')

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    system: SYSTEM_PROMPT,
    prompt,
  })

  return result.toTextStreamResponse()
}
