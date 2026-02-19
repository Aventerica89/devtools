import { NextResponse } from 'next/server'

interface RawDeployment {
  id: string
  branch: string
  status: string
  commit_sha: string
  url: string | null
  deployed_at: string | null
  created_at: string
  applications: { name: string } | null
  cloud_providers: { name: string; slug: string } | null
  environments: { name: string; slug: string } | null
}

export interface Deployment {
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

const SELECT = [
  'id',
  'branch',
  'status',
  'commit_sha',
  'url',
  'deployed_at',
  'created_at',
  'applications(name)',
  'cloud_providers(name,slug)',
  'environments(name,slug)',
].join(',')

function mapDeployment(row: RawDeployment): Deployment {
  return {
    id: row.id,
    app_name: row.applications?.name ?? '',
    provider: row.cloud_providers?.slug ?? row.cloud_providers?.name ?? '',
    environment: row.environments?.slug ?? row.environments?.name ?? '',
    branch: row.branch,
    status: row.status,
    commit_sha: row.commit_sha,
    commit_message: '',
    url: row.url ?? '',
    created_at: row.deployed_at ?? row.created_at,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectName = searchParams.get('project')

  const supabaseUrl = process.env.APP_TRACKER_SUPABASE_URL?.trim()
  const serviceKey = process.env.APP_TRACKER_SERVICE_KEY?.trim()

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
      ? `&applications.name=eq.${encodeURIComponent(projectName)}`
      : ''
    const url = [
      `${supabaseUrl}/rest/v1/deployments`,
      `?select=${encodeURIComponent(SELECT)}`,
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

    const raw: RawDeployment[] = await res.json()
    const data = raw.map(mapDeployment)
    return NextResponse.json({ data, configured: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch from App Tracker' },
      { status: 502 }
    )
  }
}
