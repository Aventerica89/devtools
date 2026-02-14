import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('devtools-session')
  return NextResponse.json({ success: true })
}
