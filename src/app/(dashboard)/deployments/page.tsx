'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GitBranch, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DeploymentTable,
  DeploymentTableSkeleton,
  type Deployment,
} from '@/components/deployment-table'

const REFRESH_INTERVAL_MS = 30_000

interface TrackerResponse {
  data: Deployment[]
  configured?: boolean
  message?: string
  error?: string
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<readonly Deployment[]>([])
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterProject, setFilterProject] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchDeployments = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true)
      }
      setRefreshing(true)

      try {
        const params = filterProject
          ? `?project=${encodeURIComponent(filterProject)}`
          : ''
        const res = await fetch(`/api/tracker${params}`)
        const json: TrackerResponse = await res.json()

        if (json.error) {
          console.error('Tracker fetch error:', json.error)
          return
        }

        setDeployments(json.data ?? [])
        setConfigured(json.configured !== false)
        setLastRefresh(new Date())
      } catch (err) {
        console.error('Failed to fetch deployments:', err)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filterProject]
  )

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchDeployments()
    const interval = setInterval(() => {
      fetchDeployments({ silent: true })
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchDeployments])

  // Derive unique project names for filter dropdown
  const projectNames = Array.from(
    new Set(deployments.map((d) => d.app_name).filter(Boolean))
  ).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-slate-400" />
          <h1 className="text-xl font-bold">Deployments</h1>
          <Badge variant="secondary" className="text-xs">
            {deployments.length}
          </Badge>
          {/* Auto-refresh indicator */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-75',
                  configured ? 'bg-green-400 animate-ping' : 'bg-slate-500'
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  configured ? 'bg-green-500' : 'bg-slate-600'
                )}
              />
            </span>
            <span className="text-xs text-slate-500">
              {configured ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Project filter */}
          {projectNames.length > 0 && (
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className={cn(
                'h-8 rounded-md border border-slate-700',
                'bg-slate-950 text-white text-sm px-2',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            >
              <option value="">All Projects</option>
              {projectNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}

          {/* Manual refresh */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDeployments()}
            disabled={refreshing}
            className="border-slate-700 text-slate-300"
          >
            <RefreshCw
              className={cn('h-4 w-4', refreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Not configured state */}
      {!configured && !loading && (
        <NotConfiguredCard />
      )}

      {/* Deployment table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-slate-400 font-normal">
              Recent Deployments
            </CardTitle>
            {lastRefresh && (
              <span className="text-xs text-slate-600">
                Updated {formatTime(lastRefresh)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DeploymentTableSkeleton />
          ) : (
            <DeploymentTable deployments={deployments} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function NotConfiguredCard() {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="flex items-start gap-4 pt-6">
        <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm text-slate-300">
            App Tracker is not configured. Connect it to see live
            deployment data.
          </p>
          <div className="text-xs text-slate-500 space-y-1">
            <p>Add these environment variables:</p>
            <code className="block bg-slate-950 p-2 rounded text-slate-400">
              APP_TRACKER_SUPABASE_URL=https://your-project.supabase.co
            </code>
            <code className="block bg-slate-950 p-2 rounded text-slate-400">
              APP_TRACKER_SERVICE_KEY=your-service-role-key
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
