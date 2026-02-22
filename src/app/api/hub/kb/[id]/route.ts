import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { apiError } from '@/lib/api'

type RichText = { plain_text: string }
type Block = Record<string, unknown>

function extractText(richText: RichText[]) {
  return richText.map((t) => t.plain_text).join('')
}

function blocksToMarkdown(blocks: Block[]): string {
  const lines: string[] = []
  for (const block of blocks) {
    const type = block.type as string
    const data = block[type] as Record<string, unknown>
    const richText = (data?.rich_text as RichText[]) ?? []
    const text = extractText(richText)
    switch (type) {
      case 'heading_1': lines.push(`# ${text}`); break
      case 'heading_2': lines.push(`## ${text}`); break
      case 'heading_3': lines.push(`### ${text}`); break
      case 'paragraph': lines.push(text); break
      case 'bulleted_list_item': lines.push(`• ${text}`); break
      case 'numbered_list_item': lines.push(`• ${text}`); break
      case 'quote': lines.push(`> ${text}`); break
      case 'code': {
        const lang = (data?.language as string) ?? ''
        lines.push('```' + lang)
        lines.push(text)
        lines.push('```')
        break
      }
      case 'to_do': {
        const checked = (data?.checked as boolean) ?? false
        lines.push(`${checked ? '[x]' : '[ ]'} ${text}`)
        break
      }
      case 'divider': lines.push('---'); break
      default: if (text) lines.push(text); break
    }
  }
  return lines.join('\n')
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return apiError(401, 'Unauthorized')

    const { id } = await params
    const token = process.env.NOTION_API_TOKEN
    if (!token) return apiError(503, 'NOTION_API_TOKEN not configured')

    const res = await fetch(`https://api.notion.com/v1/blocks/${id}/children?page_size=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    })
    if (!res.ok) return apiError(res.status, `Notion API error: ${res.status}`)

    const data = await res.json()
    const blocks = (data.results ?? []) as Block[]
    const content = blocksToMarkdown(blocks)

    return NextResponse.json({ content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch blocks: ${message}`)
  }
}
