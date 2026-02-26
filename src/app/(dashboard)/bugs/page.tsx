'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BugCard } from '@/components/bug-card'
import { CreateBugDialog } from '@/components/create-bug-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Bug } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
const STATUSES = ['open', 'in-progress', 'resolved'] as const

type BugRecord = {
  id: number
  projectId: string
  title: string
  description: string | null
  severity: string | null
  status: string | null
  screenshotUrl: string | null
  stackTrace: string | null
  pageUrl: string | null
  userAgent: string | null
  metadata: string | null
  createdAt: string | null
  resolvedAt: string | null
}

type Project = {
  id: string
  name: string
  url: string | null
  createdAt: string | null
}

const SEVERITY_FILTER_STYLES: Record<string, string> = {
  critical: 'border-red-700 text-red-300',
  high: 'border-orange-700 text-orange-300',
  medium: 'border-yellow-700 text-yellow-300',
  low: 'border-blue-700 text-blue-300',
}

const STATUS_FILTER_STYLES: Record<string, string> = {
  open: 'border-emerald-700 text-emerald-300',
  'in-progress': 'border-purple-700 text-purple-300',
  resolved: 'border-border text-muted-foreground',
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugRecord[] | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const loading = bugs === null
  const [dialogOpen, setDialogOpen] = useState(false)

  // Filters
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const fetchBugs = useCallback(async () => {
    const params = filterProject ? `?project=${filterProject}` : ''
    const res = await fetch(`/api/bugs${params}`)
    const data = await res.json()
    setBugs(data)
  }, [filterProject])

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetching */
  useEffect(() => {
    fetchBugs()
    fetchProjects()
  }, [fetchBugs, fetchProjects])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleCreate(data: {
    projectId: string
    title: string
    description: string | null
    severity: string
    pageUrl: string | null
    stackTrace: string | null
    metadata: string | null
  }) {
    await fetch('/api/bugs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    toast.success('Bug reported')
    fetchBugs()
  }

  async function handleStatusChange(id: number, status: string) {
    await fetch(`/api/bugs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    toast.success(`Bug marked as ${status}`)
    fetchBugs()
  }

  async function handleUpdate(id: number, data: { title: string; description: string | null; severity: string }) {
    try {
      const res = await fetch(`/api/bugs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Bug updated')
      fetchBugs()
    } catch {
      toast.error('Failed to update bug')
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/bugs/${id}`, { method: 'DELETE' })
    toast.success('Bug deleted')
    fetchBugs()
  }

  const filtered = (bugs ?? []).filter((bug) => {
    if (filterSeverity && bug.severity !== filterSeverity) return false
    if (filterStatus && bug.status !== filterStatus) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">Bug Tracker</h1>
          <Badge variant="secondary" className="text-xs">
            {filtered.length}
          </Badge>
        </div>

        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Bug
        </Button>

        <CreateBugDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          projects={projects}
          onSubmit={handleCreate}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Track and manage bugs across your projects. Bugs can be reported
        manually or captured automatically by the widget.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className={cn(
            'h-8 rounded-md border border-border',
            'bg-card text-foreground text-sm px-3',
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

        <div className="h-4 w-px bg-accent" />

        {SEVERITIES.map((s) => (
          <button
            key={s}
            onClick={() =>
              setFilterSeverity(filterSeverity === s ? '' : s)
            }
            className={cn(
              'px-2 py-0.5 rounded-full text-xs border capitalize',
              'transition-colors cursor-pointer',
              filterSeverity === s
                ? SEVERITY_FILTER_STYLES[s]
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {s}
          </button>
        ))}

        <div className="h-4 w-px bg-accent" />

        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() =>
              setFilterStatus(filterStatus === s ? '' : s)
            }
            className={cn(
              'px-2 py-0.5 rounded-full text-xs border capitalize',
              'transition-colors cursor-pointer',
              filterStatus === s
                ? STATUS_FILTER_STYLES[s]
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Bug List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bug className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No bugs found</p>
          <p className="text-xs mt-1">
            {bugs.length > 0
              ? 'Try adjusting your filters'
              : 'Click "New Bug" to report one'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((bug) => (
            <BugCard
              key={bug.id}
              bug={bug}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
