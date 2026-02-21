import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { apiError } from '@/lib/api'
import fs from 'fs/promises'
import path from 'path'

function parsePlansHtml(html: string) {
  const rows: { title: string; project: string; status: string; date: string }[] = []
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const cells: string[] = []
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let cellMatch
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim())
    }
    if (cells.length >= 4) {
      rows.push({ title: cells[0], project: cells[1], status: cells[2], date: cells[3] })
    }
  }
  return rows
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return apiError(401, 'Unauthorized')
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ available: false })
  try {
    const filePath = path.join(process.env.HOME ?? '~', 'Desktop', 'plans-index.html')
    const html = await fs.readFile(filePath, 'utf-8')
    return NextResponse.json({ available: true, plans: parsePlansHtml(html) })
  } catch {
    return NextResponse.json({ available: false, reason: 'File not found' })
  }
}
