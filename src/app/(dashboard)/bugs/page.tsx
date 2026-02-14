'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BugCard } from '@/components/bug-card'
import { Plus, Bug } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
const STATUSES = ['open', 'in-progress', 'resolved'] as const

const SEVERITY_FILTER_STYLES: Record<string, string> = {
  critical: 'border-red-700 text-red-300',
  high: 'border-orange-700 text-orange-300',
  medium: 'border-yellow-700 text-yellow-300',
  low: 'border-blue-700 text-blue-300',
}

const STATUS_FILTER_STYLES: Record<string, string> = {
  open: 'border-emerald-700 text-emerald-300',
  'in-progress': 'border-purple-700 text-purple-300',
  resolved: 'border-slate-600 text-slate-400',
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugRecord[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Filters
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // New bug form
  const [newBug, setNewBug] = useState({
    projectId: '',
    title: '',
    description: '',
    severity: 'medium',
    pageUrl: '',
    stackTrace: '',
  })

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

  useEffect(() => {
    Promise.all([fetchBugs(), fetchProjects()]).then(() => {
      setLoading(false)
    })
  }, [fetchBugs, fetchProjects])

  async function handleCreate() {
    if (!newBug.projectId || !newBug.title) return

    await fetch('/api/bugs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newBug,
        description: newBug.description || null,
        pageUrl: newBug.pageUrl || null,
        stackTrace: newBug.stackTrace || null,
      }),
    })

    setNewBug({
      projectId: '',
      title: '',
      description: '',
      severity: 'medium',
      pageUrl: '',
      stackTrace: '',
    })
    setDialogOpen(false)
    fetchBugs()
  }

  async function handleStatusChange(id: number, status: string) {
    await fetch(`/api/bugs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchBugs()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/bugs/${id}`, { method: 'DELETE' })
    fetchBugs()
  }

  const filtered = bugs.filter((bug) => {
    if (filterSeverity && bug.severity !== filterSeverity) return false
    if (filterStatus && bug.status !== filterStatus) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading bugs...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-slate-400" />
          <h1 className="text-xl font-bold">Bug Tracker</h1>
          <Badge variant="secondary" className="text-xs">
            {filtered.length}
          </Badge>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Bug
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle>Report a Bug</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <select
                  value={newBug.projectId}
                  onChange={(e) =>
                    setNewBug({ ...newBug, projectId: e.target.value })
                  }
                  className={cn(
                    'w-full h-9 rounded-md border border-slate-700',
                    'bg-slate-950 text-white text-sm px-3',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newBug.title}
                  onChange={(e) =>
                    setNewBug({ ...newBug, title: e.target.value })
                  }
                  placeholder="Brief description of the bug"
                  className="bg-slate-950 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={newBug.description}
                  onChange={(e) =>
                    setNewBug({ ...newBug, description: e.target.value })
                  }
                  placeholder="Steps to reproduce, expected vs actual behavior"
                  rows={3}
                  className={cn(
                    'w-full rounded-md border border-slate-700',
                    'bg-slate-950 text-white text-sm p-3',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    'resize-none'
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <div className="flex gap-2">
                  {SEVERITIES.map((s) => (
                    <Button
                      key={s}
                      variant={newBug.severity === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewBug({ ...newBug, severity: s })}
                      className="capitalize text-xs"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Page URL (optional)</Label>
                <Input
                  value={newBug.pageUrl}
                  onChange={(e) =>
                    setNewBug({ ...newBug, pageUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="bg-slate-950 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Stack Trace (optional)</Label>
                <textarea
                  value={newBug.stackTrace}
                  onChange={(e) =>
                    setNewBug({ ...newBug, stackTrace: e.target.value })
                  }
                  placeholder="Paste stack trace here"
                  rows={3}
                  className={cn(
                    'w-full rounded-md border border-slate-700',
                    'bg-slate-950 text-white text-sm p-3 font-mono',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    'resize-none'
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newBug.projectId || !newBug.title}
              >
                Submit Bug
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className={cn(
            'h-8 rounded-md border border-slate-700',
            'bg-slate-900 text-white text-sm px-3',
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

        <div className="h-4 w-px bg-slate-700" />

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
                : 'border-slate-700 text-slate-500 hover:text-slate-300'
            )}
          >
            {s}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-700" />

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
                : 'border-slate-700 text-slate-500 hover:text-slate-300'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Bug List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
