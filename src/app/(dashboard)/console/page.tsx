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

type ConsoleEntry = {
  id: number
  projectId: string
  level: string
  message: string
  source: string | null
  lineNumber: number | null
  timestamp: string | null
}

const LEVELS = ['log', 'warn', 'error', 'info'] as const

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

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function ConsolePage() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([])
  const [filterLevel, setFilterLevel] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchEntries = useCallback(async () => {
    // Console entries will come from the widget interceptor
    // For now, return empty array
    setEntries([])
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetching */
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = entries.filter((entry) => {
    if (filterLevel && entry.level !== filterLevel) return false
    if (!searchQuery) return true
    return entry.message.toLowerCase().includes(searchQuery.toLowerCase())
  })

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
        <div
          className={cn(
            'rounded-lg border border-border bg-background',
            'font-mono text-xs overflow-hidden'
          )}
        >
          {filtered.map((entry) => {
            const config =
              LEVEL_CONFIG[entry.level] || LEVEL_CONFIG.log
            const Icon = config.icon
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
                <span className="text-muted-foreground shrink-0">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
