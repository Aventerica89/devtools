import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { isNotNull } from 'drizzle-orm'
import { fetchAllDeployments } from '@/lib/deployment-providers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filterProject = searchParams.get('project')
  const limit = Math.min(Number(searchParams.get('limit') ?? 10), 50)

  const tokens = {
    vercel: process.env.VERCEL_API_TOKEN?.trim(),
    cloudflare: process.env.CF_API_TOKEN?.trim(),
    cloudflareAccountId: process.env.CF_ACCOUNT_ID?.trim(),
    github: process.env.GITHUB_TOKEN?.trim(),
  }

  const hasAnyToken = tokens.vercel || tokens.cloudflare || tokens.github
  if (!hasAnyToken) {
    return NextResponse.json({
      data: [],
      configured: false,
      message:
        'No platform tokens configured. Add VERCEL_API_TOKEN, CF_API_TOKEN, or GITHUB_TOKEN.',
    })
  }

  try {
    // Fetch projects with a platform configured
    const allProjects = await db
      .select()
      .from(projects)
      .where(isNotNull(projects.platform))
      .all()

    const configured = allProjects.filter(
      (p) => p.platform && p.platformId
    )

    // Optionally filter to a single project
    const targets = filterProject
      ? configured.filter((p) => p.id === filterProject)
      : configured

    const projectConfigs = targets.map((p) => ({
      appName: p.name,
      platform: p.platform as 'vercel' | 'cloudflare-workers' | 'cloudflare-pages' | 'github',
      platformId: p.platformId!,
    }))

    const data = await fetchAllDeployments(projectConfigs, tokens, limit)

    return NextResponse.json({
      data,
      configured: true,
      projectCount: configured.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to fetch deployments: ${message}` },
      { status: 500 }
    )
  }
}
