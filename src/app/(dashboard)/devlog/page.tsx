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
import {
  Plus,
  ScrollText,
  StickyNote,
  AlertCircle,
  AlertTriangle,
  Gauge,
  Globe,
  Search,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format-date'
import { PaginationControls } from '@/components/pagination-controls'

type DevLogEntry = {
  id: number
  projectId: string
  type: string
  title: string
  content: string | null
  source: string | null
  metadata: string | null
  createdAt: string | null
}

type Project = {
  id: string
  name: string
  url: string | null
  createdAt: string | null
}

const LOG_TYPES = ['note', 'error', 'warning', 'perf', 'network'] as const
const PAGE_SIZE = 20

const TYPE_CONFIG: Record<string, {
  icon: typeof StickyNote
  color: string
  filterStyle: string
}> = {
  note: {
    icon: StickyNote,
    color: 'text-blue-400',
    filterStyle: 'border-blue-700 text-blue-300',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    filterStyle: 'border-red-700 text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    filterStyle: 'border-yellow-700 text-yellow-300',
  },
  perf: {
    icon: Gauge,
    color: 'text-purple-400',
    filterStyle: 'border-purple-700 text-purple-300',
  },
  network: {
    icon: Globe,
    color: 'text-emerald-400',
    filterStyle: 'border-emerald-700 text-emerald-300',
  },
}

const SOURCE_FILTER_STYLES: Record<string, string> = {
  manual: 'border-cyan-700 text-cyan-300',
  auto: 'border-amber-700 text-amber-300',
}

export default function DevLogPage() {
  const [entries, setEntries] = useState<DevLogEntry[] | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const loading = entries === null
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Filters
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterSource, setFilterSource] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // New entry form
  const [newEntry, setNewEntry] = useState({
    projectId: '',
    type: 'note',
    title: '',
    content: '',
  })

  const fetchEntries = useCallback(async () => {
    const params = new URLSearchParams()
    params.set('limit', '500')
    if (filterProject) params.set('project', filterProject)
    if (filterType) params.set('type', filterType)
    const qs = params.toString()
    const res = await fetch(`/api/devlog?${qs}`)
    const data = await res.json()
    setEntries(data)
  }, [filterProject, filterType])

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetching */
  useEffect(() => {
    fetchEntries()
    fetchProjects()
  }, [fetchEntries, fetchProjects])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [filterProject, filterType, filterSource, searchQuery])

  async function handleCreate() {
    if (!newEntry.projectId || !newEntry.title) return

    await fetch('/api/devlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newEntry,
        content: newEntry.content || null,
      }),
    })

    setNewEntry({
      projectId: '',
      type: 'note',
      title: '',
      content: '',
    })
    setDialogOpen(false)
    fetchEntries()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/devlog/${id}`, { method: 'DELETE' })
    fetchEntries()
  }

  const filtered = (entries ?? []).filter((entry) => {
    if (filterSource && entry.source !== filterSource) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const titleMatch = entry.title.toLowerCase().includes(q)
    const contentMatch = entry.content?.toLowerCase().includes(q) ?? false
    return titleMatch || contentMatch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading dev log...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">Dev Log</h1>
          <Badge variant="secondary" className="text-xs">
            {filtered.length}
          </Badge>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Dev Log Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <select
                  value={newEntry.projectId}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, projectId: e.target.value })
                  }
                  className={cn(
                    'w-full h-9 rounded-md border border-border',
                    'bg-background text-foreground text-sm px-3',
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
                <Label>Type</Label>
                <div className="flex gap-2">
                  {LOG_TYPES.map((t) => {
                    const config = TYPE_CONFIG[t]
                    const Icon = config.icon
                    return (
                      <Button
                        key={t}
                        variant={newEntry.type === t ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setNewEntry({ ...newEntry, type: t })
                        }
                        className="capitalize text-xs gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {t}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                  placeholder="What happened?"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Content (optional)</Label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, content: e.target.value })
                  }
                  placeholder="Details, context, or notes"
                  rows={4}
                  className={cn(
                    'w-full rounded-md border border-border',
                    'bg-background text-foreground text-sm p-3',
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
                disabled={!newEntry.projectId || !newEntry.title}
              >
                Add Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Development timeline combining manual notes and auto-captured events.
        Use it to track decisions, issues, and progress.
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

        {LOG_TYPES.map((t) => {
          const config = TYPE_CONFIG[t]
          const Icon = config.icon
          return (
            <button
              key={t}
              onClick={() =>
                setFilterType(filterType === t ? '' : t)
              }
              className={cn(
                'px-2 py-0.5 rounded-full text-xs border capitalize',
                'transition-colors cursor-pointer',
                'flex items-center gap-1',
                filterType === t
                  ? config.filterStyle
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3 w-3" />
              {t}
            </button>
          )
        })}

        <div className="h-4 w-px bg-accent" />

        {(['manual', 'auto'] as const).map((s) => (
          <button
            key={s}
            onClick={() =>
              setFilterSource(filterSource === s ? '' : s)
            }
            className={cn(
              'px-2 py-0.5 rounded-full text-xs border capitalize',
              'transition-colors cursor-pointer',
              filterSource === s
                ? SOURCE_FILTER_STYLES[s]
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {s}
          </button>
        ))}

        <div className="h-4 w-px bg-accent" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className={cn(
              'h-8 w-48 pl-7 text-xs',
              'bg-card border-border'
            )}
          />
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No log entries found</p>
          <p className="text-xs mt-1">
            {(entries ?? []).length > 0
              ? 'Try adjusting your filters'
              : 'Click "Add Note" to create one'}
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-1">
              {paged.map((entry) => {
                const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.note
                const Icon = config.icon
                return (
                  <div key={entry.id} className="relative flex gap-4 pl-0">
                    {/* Icon dot */}
                    <div
                      className={cn(
                        'relative z-10 flex items-center justify-center',
                        'h-8 w-8 rounded-full bg-card border border-border',
                        'shrink-0'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>

                    {/* Entry card */}
                    <div
                      className={cn(
                        'flex-1 rounded-lg border border-border',
                        'bg-card p-3 mb-1'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {entry.title}
                            </span>
                            <Badge
                              className={cn(
                                'text-[10px] uppercase border shrink-0',
                                config.filterStyle
                              )}
                            >
                              {entry.type}
                            </Badge>
                            {entry.source === 'auto' && (
                              <Badge
                                className={cn(
                                  'text-[10px] border shrink-0',
                                  'border-amber-700 text-amber-300'
                                )}
                              >
                                auto
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-mono text-muted-foreground">
                            {formatDate(entry.createdAt)}
                            {' | '}
                            {entry.projectId}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-red-400 shrink-0"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {entry.content && (
                        <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                          {entry.content}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <PaginationControls
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
