'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gauge, RefreshCw, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreCards } from '@/components/perf/score-cards'
import { TrendChartsGrid } from '@/components/perf/trend-chart'
import { PageBreakdown } from '@/components/perf/page-breakdown'
import { THRESHOLDS } from '@/components/perf/types'
import type { PerfEntry } from '@/components/perf/types'

type Project = {
  readonly id: string
  readonly name: string
  readonly url: string | null
  readonly createdAt: string | null
}

const DATE_RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'All time', value: 365 },
] as const

export default function PerfPage() {
  const [entries, setEntries] = useState<readonly PerfEntry[]>([])
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [filterProject, setFilterProject] = useState('')
  const [filterDays, setFilterDays] = useState(7)

  const fetchEntries = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setRefreshing(true)

    try {
      const params = new URLSearchParams()
      params.set('days', String(filterDays))
      if (filterProject) params.set('projectId', filterProject)

      const res = await fetch(`/api/perf?${params.toString()}`)
      const data: PerfEntry[] = await res.json()
      setEntries(data)
    } catch (err) {
      console.error('Failed to fetch perf data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterProject, filterDays])

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      const data: Project[] = await res.json()
      setProjects(data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchEntries(), fetchProjects()]).then(() => {
      setLoading(false)
    })
  }, [fetchEntries, fetchProjects])

  const perfEntryCount = entries.length
  const hasData = perfEntryCount > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading performance data...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-bold">Performance</h1>
          <Badge variant="secondary" className="text-xs">
            {perfEntryCount} entries
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* Project filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className={cn(
              'h-8 rounded-md border border-border',
              'bg-background text-foreground text-sm px-2',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Date range filter */}
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(Number(e.target.value))}
            className={cn(
              'h-8 rounded-md border border-border',
              'bg-background text-foreground text-sm px-2',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Refresh */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchEntries()}
            disabled={refreshing}
            className="border-border text-foreground"
          >
            <RefreshCw
              className={cn('h-4 w-4', refreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Core Web Vitals (LCP, CLS, INP, FCP, TTFB) collected by the widget.
        Tracks page load performance over time.
      </p>

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* Current Scores */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Current Scores
            </h2>
            <ScoreCards entries={entries} thresholds={THRESHOLDS} />
          </section>

          {/* Trend Charts */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Trends ({filterDays}d)
            </h2>
            <TrendChartsGrid
              entries={entries}
              thresholds={THRESHOLDS}
              days={filterDays}
            />
          </section>

          {/* Per-Page Breakdown */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Per-Page Breakdown
            </h2>
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4">
                <PageBreakdown
                  entries={entries}
                  thresholds={THRESHOLDS}
                />
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Zap className="h-5 w-5 text-purple-400" />
          No Performance Data Yet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Performance metrics are automatically collected by the DevTools
          widget using the Web Vitals library. Once configured, you will
          see LCP, CLS, INP, FCP, and TTFB scores here.
        </p>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase">
            Setup Steps
          </p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">
            <li>
              Add the DevTools widget script to your site
            </li>
            <li>
              Enable the &quot;Performance&quot; tool in your widget
              config
            </li>
            <li>
              Metrics will be reported automatically on page load and
              user interaction
            </li>
          </ol>
        </div>
        <div className="bg-background rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Widget script tag:</p>
          <code className="text-xs text-purple-400 block">
            {'<script src="https://your-domain/widget.js"'}
            {' data-project="your-project-id"></script>'}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}
