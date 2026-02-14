import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'

export async function GET() {
  const all = await db.select().from(projects).all()
  return NextResponse.json(all)
}

export async function POST(request: Request) {
  const body = await request.json()
  const result = await db.insert(projects).values({
    id: body.id,
    name: body.name,
    url: body.url || null,
  }).returning()
  return NextResponse.json(result[0], { status: 201 })
}
