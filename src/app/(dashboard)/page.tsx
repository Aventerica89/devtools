'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatCards, type DashboardStats } from '@/components/dashboard/stat-cards'
import { RecentBugs, type BugSummary } from '@/components/dashboard/recent-bugs'
import {
  RecentActivity,
  type DevlogEntry,
} from '@/components/dashboard/recent-activity'
import { Bug, Send, GitBranch, LayoutDashboard } from 'lucide-react'

const INITIAL_STATS: DashboardStats = {
  totalProjects: 0,
  openBugs: 0,
  recentErrors: 0,
  perfScore: null,
  perfScoreColor: 'text-muted-foreground',
}

function perfScoreColor(score: string | null): string {
  if (!score) return 'text-muted-foreground'
  const lower = score.toLowerCase()
  if (lower === 'good') return 'text-emerald-400'
  if (lower === 'needs-improvement' || lower === 'needs improvement') {
    return 'text-yellow-400'
  }
  if (lower === 'poor') return 'text-red-400'
  return 'text-muted-foreground'
}

function parsePerfScore(
  entries: readonly { metadata: string | null }[]
): string | null {
  if (entries.length === 0) return null

  const latest = entries[0]
  if (!latest.metadata) return null

  try {
    const parsed = JSON.parse(latest.metadata)
    const lcp = parsed?.lcp ?? parsed?.LCP
    if (typeof lcp === 'object' && lcp?.rating) {
      return lcp.rating
    }
    if (typeof lcp === 'string') return lcp
    return null
  } catch {
    return null
  }
}

const QUICK_ACTIONS = [
  { href: '/bugs', label: 'Report Bug', icon: Bug },
  { href: '/api-tester', label: 'API Tester', icon: Send },
  { href: '/deployments', label: 'View Deployments', icon: GitBranch },
] as const

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS)
  const [bugs, setBugs] = useState<readonly BugSummary[]>([])
  const [activity, setActivity] = useState<readonly DevlogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const [projectsRes, bugsRes, errorsRes, perfRes, activityRes] =
        await Promise.all([
          fetch('/api/projects'),
          fetch('/api/bugs?status=open&limit=5'),
          fetch('/api/devlog?type=error&days=1'),
          fetch('/api/perf?days=1'),
          fetch('/api/devlog?limit=10'),
        ])

      const [projectsData, bugsData, errorsData, perfData, activityData] =
        await Promise.all([
          projectsRes.json(),
          bugsRes.json(),
          errorsRes.json(),
          perfRes.json(),
          activityRes.json(),
        ])

      const score = parsePerfScore(perfData)

      setStats({
        totalProjects: Array.isArray(projectsData) ? projectsData.length : 0,
        openBugs: Array.isArray(bugsData) ? bugsData.length : 0,
        recentErrors: Array.isArray(errorsData) ? errorsData.length : 0,
        perfScore: score,
        perfScoreColor: perfScoreColor(score),
      })

      setBugs(Array.isArray(bugsData) ? bugsData : [])
      setActivity(Array.isArray(activityData) ? activityData : [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>

      {/* Stats Row */}
      <StatCards stats={stats} loading={loading} />

      {/* Two-column: Bugs + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentBugs bugs={bugs} loading={loading} />
        <RecentActivity entries={activity} loading={loading} />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.href}
            variant="outline"
            size="sm"
            asChild
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <Link href={action.href}>
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
