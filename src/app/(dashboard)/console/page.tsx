'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Terminal,
  Search,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/format-date'
import { PaginationControls } from '@/components/pagination-controls'

type ConsoleEntry = {
  id: number
  projectId: string
  level: string
  message: string
  source: string | null
  lineNumber: number | null
  timestamp: string | null
}

type Project = {
  id: string
  name: string
}

const LEVELS = ['log', 'warn', 'error', 'info'] as const
const PAGE_SIZE = 20

const LEVEL_CONFIG: Record<
  string,
  { icon: typeof Info; color: string; filterStyle: string }
> = {
  log: {
    icon: MessageSquare,
    color: 'text-foreground',
    filterStyle: 'border-border text-foreground',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    filterStyle: 'border-yellow-700 text-yellow-300',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    filterStyle: 'border-red-700 text-red-300',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    filterStyle: 'border-blue-700 text-blue-300',
  },
}

export default function ConsolePage() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filterLevel, setFilterLevel] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/devlog?type=console&limit=500')
      const data = await res.json()
      const mapped: ConsoleEntry[] = data.map(
        (row: {
          id: number
          projectId: string
          title: string
          content: string | null
          metadata: string | null
          createdAt: string | null
        }) => {
          const meta = row.metadata ? JSON.parse(row.metadata) : {}
          return {
            id: row.id,
            projectId: row.projectId,
            level: meta.level || 'log',
            message: row.title,
            source: null,
            lineNumber: null,
            timestamp: row.createdAt,
          }
        }
      )
      setEntries(mapped)
    } catch {
      setEntries([])
    }
  }, [])

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data)
    } catch {
      setProjects([])
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetching */
  useEffect(() => {
    fetchEntries()
    fetchProjects()
  }, [fetchEntries, fetchProjects])
  /* eslint-enable react-hooks/set-state-in-effect */

  const projectMap = new Map(projects.map((p) => [p.id, p.name]))

  const filtered = entries.filter((entry) => {
    if (filterLevel && entry.level !== filterLevel) return false
    if (!searchQuery) return true
    return entry.message.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [filterLevel, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">Console Log</h1>
          <Badge variant="secondary" className="text-xs">
            {filtered.length}
          </Badge>
        </div>

        {entries.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEntries([])}
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Live console output captured from your sites via the DevTools widget.
        Shows console.log, warn, error, and info messages.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {LEVELS.map((level) => {
          const config = LEVEL_CONFIG[level]
          const Icon = config.icon
          return (
            <button
              key={level}
              onClick={() =>
                setFilterLevel(filterLevel === level ? '' : level)
              }
              className={cn(
                'px-2 py-0.5 rounded-full text-xs border capitalize',
                'transition-colors cursor-pointer',
                'flex items-center gap-1',
                filterLevel === level
                  ? config.filterStyle
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3 w-3" />
              {level}
            </button>
          )
        })}

        <div className="h-4 w-px bg-accent" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter output..."
            className={cn(
              'h-8 w-56 pl-7 text-xs font-mono',
              'bg-card border-border'
            )}
          />
        </div>
      </div>

      {/* Console output */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Terminal className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No console output</p>
          <p className="text-xs mt-1">
            Install the widget on your site to capture console.log,
            warn, error, and info messages.
          </p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              'rounded-lg border border-border bg-background',
              'font-mono text-xs overflow-hidden'
            )}
          >
            {paged.map((entry) => {
              const config =
                LEVEL_CONFIG[entry.level] || LEVEL_CONFIG.log
              const Icon = config.icon
              const projectName = projectMap.get(entry.projectId)
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-start gap-2 px-3 py-1.5',
                    'border-b border-border/50 last:border-0',
                    'hover:bg-card/50'
                  )}
                >
                  <Icon
                    className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', config.color)}
                  />
                  <span className="flex-1 text-foreground break-all">
                    {entry.message}
                  </span>
                  {projectName && (
                    <span className="text-muted-foreground/70 shrink-0 text-[10px]">
                      {projectName}
                    </span>
                  )}
                  <span className="text-muted-foreground shrink-0">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              )
            })}
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
