'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  Search,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ErrorEntry = {
  id: number
  projectId: string
  message: string
  source: string | null
  lineNumber: number | null
  colNumber: number | null
  stackTrace: string | null
  type: string
  pageUrl: string | null
  userAgent: string | null
  timestamp: string | null
}

const ERROR_TYPES = ['error', 'unhandledrejection'] as const

const TYPE_STYLES: Record<string, string> = {
  error: 'border-red-700 text-red-300',
  unhandledrejection: 'border-orange-700 text-orange-300',
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ErrorsPage() {
  const [entries, setEntries] = useState<ErrorEntry[]>([])
  const [filterType, setFilterType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/devlog?type=error&limit=200')
      const data = await res.json()
      const mapped: ErrorEntry[] = data.map(
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
            message: row.title,
            source: meta.source || null,
            lineNumber: meta.line ?? null,
            colNumber: meta.col ?? null,
            stackTrace: row.content || null,
            type: meta.errorType || 'error',
            pageUrl: null,
            userAgent: null,
            timestamp: row.createdAt,
          }
        }
      )
      setEntries(mapped)
    } catch {
      setEntries([])
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetching */
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = entries.filter((entry) => {
    if (filterType && entry.type !== filterType) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      entry.message.toLowerCase().includes(q) ||
      (entry.source?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">Error Log</h1>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {ERROR_TYPES.map((type) => (
          <button
            key={type}
            onClick={() =>
              setFilterType(filterType === type ? '' : type)
            }
            className={cn(
              'px-2 py-0.5 rounded-full text-xs border',
              'transition-colors cursor-pointer',
              filterType === type
                ? TYPE_STYLES[type]
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {type === 'unhandledrejection'
              ? 'Unhandled Promise'
              : 'Runtime Error'}
          </button>
        ))}

        <div className="h-4 w-px bg-accent" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search errors..."
            className={cn(
              'h-8 w-56 pl-7 text-xs',
              'bg-card border-border'
            )}
          />
        </div>
      </div>

      {/* Error list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No errors captured</p>
          <p className="text-xs mt-1">
            Install the widget on your site to capture window.onerror
            and unhandled promise rejections.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                'rounded-lg border border-border',
                'bg-card overflow-hidden'
              )}
            >
              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === entry.id ? null : entry.id
                  )
                }
                className="w-full text-left p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span className="text-sm font-mono text-red-300 truncate">
                        {entry.message}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge
                        className={cn(
                          'text-[10px] border',
                          TYPE_STYLES[entry.type] ||
                            TYPE_STYLES.error
                        )}
                      >
                        {entry.type === 'unhandledrejection'
                          ? 'promise'
                          : 'error'}
                      </Badge>
                      {entry.source && (
                        <span className="font-mono truncate">
                          {entry.source}
                          {entry.lineNumber
                            ? `:${entry.lineNumber}`
                            : ''}
                          {entry.colNumber
                            ? `:${entry.colNumber}`
                            : ''}
                        </span>
                      )}
                      <span>{formatTime(entry.timestamp)}</span>
                    </div>
                  </div>
                  <Trash2
                    className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400 shrink-0 mt-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEntries((prev) =>
                        prev.filter((en) => en.id !== entry.id)
                      )
                    }}
                  />
                </div>
              </button>

              {expandedId === entry.id && (
                <div className="border-t border-border p-3 space-y-3">
                  {entry.pageUrl && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Page
                      </p>
                      <a
                        href={entry.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {entry.pageUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {entry.stackTrace && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Stack Trace
                      </p>
                      <pre
                        className={cn(
                          'text-xs font-mono text-muted-foreground',
                          'bg-background rounded p-2',
                          'overflow-x-auto whitespace-pre-wrap'
                        )}
                      >
                        {entry.stackTrace}
                      </pre>
                    </div>
                  )}

                  {entry.userAgent && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        User Agent
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {entry.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
