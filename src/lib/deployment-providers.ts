import type { Deployment } from '@/components/deployment-table'

type Platform = 'vercel' | 'cloudflare-workers' | 'cloudflare-pages' | 'github'

type ProjectConfig = {
  appName: string
  platform: Platform
  platformId: string
}

// ---------------------------------------------------------------------------
// Vercel
// ---------------------------------------------------------------------------

type VercelDeployment = {
  uid: string
  name: string
  url: string
  state: string
  created: number
  meta?: {
    githubCommitSha?: string
    githubCommitMessage?: string
    githubCommitRef?: string
  }
  target: string | null
}

async function fetchVercel(
  config: ProjectConfig,
  token: string,
  limit: number
): Promise<Deployment[]> {
  const url = new URL('https://api.vercel.com/v6/deployments')
  url.searchParams.set('projectId', config.platformId)
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []

  const json = await res.json()
  const deployments: VercelDeployment[] = json.deployments ?? []

  return deployments.map((d) => ({
    id: d.uid,
    app_name: config.appName,
    provider: 'vercel',
    environment: d.target ?? 'preview',
    branch: d.meta?.githubCommitRef ?? '',
    status: mapVercelState(d.state),
    commit_sha: d.meta?.githubCommitSha ?? '',
    commit_message: d.meta?.githubCommitMessage ?? '',
    url: d.url ? `https://${d.url}` : '',
    created_at: new Date(d.created).toISOString(),
  }))
}

function mapVercelState(state: string): string {
  const map: Record<string, string> = {
    READY: 'ready',
    BUILDING: 'building',
    ERROR: 'error',
    QUEUED: 'queued',
    CANCELED: 'canceled',
    INITIALIZING: 'building',
  }
  return map[state] ?? state.toLowerCase()
}

// ---------------------------------------------------------------------------
// Cloudflare Workers
// ---------------------------------------------------------------------------

type CfWorkersDeployment = {
  id: string
  source: string
  strategy: string
  author_email: string
  created_on: string
  versions: Array<{
    version_id: string
    percentage: number
  }>
}

async function fetchCloudflareWorkers(
  config: ProjectConfig,
  token: string,
  accountId: string,
  limit: number
): Promise<Deployment[]> {
  const url = [
    `https://api.cloudflare.com/client/v4/accounts/${accountId}`,
    `/workers/scripts/${encodeURIComponent(config.platformId)}`,
    `/deployments`,
  ].join('')

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []

  const json = await res.json()
  const items: CfWorkersDeployment[] = json.result?.deployments ?? []

  return items.slice(0, limit).map((d) => ({
    id: d.id,
    app_name: config.appName,
    provider: 'cloudflare',
    environment: 'production',
    branch: '',
    status: 'deployed',
    commit_sha: '',
    commit_message: d.author_email ? `by ${d.author_email}` : '',
    url: '',
    created_at: d.created_on,
  }))
}

// ---------------------------------------------------------------------------
// Cloudflare Pages
// ---------------------------------------------------------------------------

type CfPagesDeployment = {
  id: string
  url: string
  environment: string
  latest_stage: { name: string; status: string }
  deployment_trigger: {
    metadata?: {
      branch: string
      commit_hash: string
      commit_message: string
    }
  }
  created_on: string
}

async function fetchCloudflarePages(
  config: ProjectConfig,
  token: string,
  accountId: string,
  limit: number
): Promise<Deployment[]> {
  const url = [
    `https://api.cloudflare.com/client/v4/accounts/${accountId}`,
    `/pages/projects/${encodeURIComponent(config.platformId)}`,
    `/deployments?per_page=${limit}`,
  ].join('')

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []

  const json = await res.json()
  const items: CfPagesDeployment[] = json.result ?? []

  return items.map((d) => ({
    id: d.id,
    app_name: config.appName,
    provider: 'cloudflare',
    environment: d.environment ?? 'production',
    branch: d.deployment_trigger?.metadata?.branch ?? '',
    status: mapCfPagesStatus(d.latest_stage),
    commit_sha: d.deployment_trigger?.metadata?.commit_hash ?? '',
    commit_message: d.deployment_trigger?.metadata?.commit_message ?? '',
    url: d.url ?? '',
    created_at: d.created_on,
  }))
}

function mapCfPagesStatus(stage: { name: string; status: string }): string {
  if (stage.status === 'success' && stage.name === 'deploy') return 'ready'
  if (stage.status === 'active') return 'building'
  if (stage.status === 'failure') return 'error'
  return stage.status
}

// ---------------------------------------------------------------------------
// GitHub Actions
// ---------------------------------------------------------------------------

type GhWorkflowRun = {
  id: number
  name: string
  head_branch: string
  head_sha: string
  status: string
  conclusion: string | null
  created_at: string
  html_url: string
  display_title: string
}

async function fetchGitHub(
  config: ProjectConfig,
  token: string,
  limit: number
): Promise<Deployment[]> {
  const url = [
    `https://api.github.com/repos/${config.platformId}`,
    `/actions/runs?per_page=${limit}`,
  ].join('')

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) return []

  const json = await res.json()
  const runs: GhWorkflowRun[] = json.workflow_runs ?? []

  return runs.map((r) => ({
    id: String(r.id),
    app_name: config.appName,
    provider: 'github',
    environment: r.name ?? 'actions',
    branch: r.head_branch,
    status: mapGhStatus(r.status, r.conclusion),
    commit_sha: r.head_sha,
    commit_message: r.display_title ?? '',
    url: r.html_url,
    created_at: r.created_at,
  }))
}

function mapGhStatus(status: string, conclusion: string | null): string {
  if (status === 'completed') {
    if (conclusion === 'success') return 'ready'
    if (conclusion === 'failure') return 'error'
    return conclusion ?? 'completed'
  }
  if (status === 'in_progress') return 'building'
  if (status === 'queued') return 'queued'
  return status
}

// ---------------------------------------------------------------------------
// Unified fetcher
// ---------------------------------------------------------------------------

type Tokens = {
  vercel?: string
  cloudflare?: string
  cloudflareAccountId?: string
  github?: string
}

export async function fetchAllDeployments(
  projects: ProjectConfig[],
  tokens: Tokens,
  limit = 10
): Promise<Deployment[]> {
  const promises = projects.map((project) => {
    switch (project.platform) {
      case 'vercel':
        return tokens.vercel
          ? fetchVercel(project, tokens.vercel, limit)
          : Promise.resolve([])
      case 'cloudflare-workers':
        return tokens.cloudflare && tokens.cloudflareAccountId
          ? fetchCloudflareWorkers(
              project,
              tokens.cloudflare,
              tokens.cloudflareAccountId,
              limit
            )
          : Promise.resolve([])
      case 'cloudflare-pages':
        return tokens.cloudflare && tokens.cloudflareAccountId
          ? fetchCloudflarePages(
              project,
              tokens.cloudflare,
              tokens.cloudflareAccountId,
              limit
            )
          : Promise.resolve([])
      case 'github':
        return tokens.github
          ? fetchGitHub(project, tokens.github, limit)
          : Promise.resolve([])
      default:
        return Promise.resolve([])
    }
  })

  const results = await Promise.allSettled(promises)

  const all: Deployment[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      all.push(...result.value)
    }
  }

  // Sort by created_at descending
  all.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return all
}
