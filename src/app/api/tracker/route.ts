import { NextResponse } from 'next/server'

interface Deployment {
  id: string
  app_name: string
  provider: string
  environment: string
  branch: string
  status: string
  commit_sha: string
  commit_message: string
  url: string
  created_at: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectName = searchParams.get('project')

  const supabaseUrl = process.env.APP_TRACKER_SUPABASE_URL
  const serviceKey = process.env.APP_TRACKER_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({
      data: [],
      configured: false,
      message:
        'App Tracker not configured. Set APP_TRACKER_SUPABASE_URL and APP_TRACKER_SERVICE_KEY.',
    })
  }

  try {
    const filter = projectName
      ? `&app_name=eq.${encodeURIComponent(projectName)}`
      : ''
    const url = [
      `${supabaseUrl}/rest/v1/deployments`,
      `?select=*`,
      `&order=created_at.desc`,
      `&limit=20`,
      filter,
    ].join('')

    const res = await fetch(url, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Supabase returned ${res.status}` },
        { status: 502 }
      )
    }

    const data: Deployment[] = await res.json()
    return NextResponse.json({ data, configured: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch from App Tracker' },
      { status: 502 }
    )
  }
}
