'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Globe,
  Search,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NetworkEntry = {
  id: number
  projectId: string
  method: string
  url: string
  status: number | null
  duration: number | null
  size: number | null
  type: string | null
  timestamp: string | null
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PUT: 'text-yellow-400',
  DELETE: 'text-red-400',
  PATCH: 'text-purple-400',
}

const STATUS_COLORS: Record<string, string> = {
  '2xx': 'text-emerald-400',
  '3xx': 'text-blue-400',
  '4xx': 'text-yellow-400',
  '5xx': 'text-red-400',
}

function getStatusColor(status: number | null): string {
  if (!status) return 'text-slate-500'
  if (status < 300) return STATUS_COLORS['2xx']
  if (status < 400) return STATUS_COLORS['3xx']
  if (status < 500) return STATUS_COLORS['4xx']
  return STATUS_COLORS['5xx']
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
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

export default function NetworkPage() {
  const [entries, setEntries] = useState<NetworkEntry[]>([])
  const [filterMethod, setFilterMethod] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchEntries = useCallback(async () => {
    // Network entries will come from the widget interceptor
    setEntries([])
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetching */
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = entries.filter((entry) => {
    if (filterMethod && entry.method !== filterMethod) return false
    if (!searchQuery) return true
    return entry.url.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-slate-400" />
          <h1 className="text-xl font-bold">Network Log</h1>
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
        {METHODS.map((method) => (
          <button
            key={method}
            onClick={() =>
              setFilterMethod(filterMethod === method ? '' : method)
            }
            className={cn(
              'px-2 py-0.5 rounded-full text-xs border font-mono',
              'transition-colors cursor-pointer',
              filterMethod === method
                ? 'border-slate-500 text-white'
                : 'border-slate-700 text-slate-500 hover:text-slate-300'
            )}
          >
            {method}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-700" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter URLs..."
            className={cn(
              'h-8 w-56 pl-7 text-xs font-mono',
              'bg-slate-900 border-slate-700'
            )}
          />
        </div>
      </div>

      {/* Network table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No network requests</p>
          <p className="text-xs mt-1">
            Install the widget on your site to intercept fetch and
            XMLHttpRequest calls.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          {/* Table header */}
          <div
            className={cn(
              'grid grid-cols-[80px_1fr_70px_80px_80px_90px] gap-2',
              'px-3 py-2 bg-slate-900 text-xs text-slate-500',
              'border-b border-slate-800 font-medium'
            )}
          >
            <span>Method</span>
            <span>URL</span>
            <span>Status</span>
            <span>Duration</span>
            <span>Size</span>
            <span>Time</span>
          </div>

          {/* Rows */}
          {filtered.map((entry) => (
            <div key={entry.id}>
              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === entry.id ? null : entry.id
                  )
                }
                className={cn(
                  'grid grid-cols-[80px_1fr_70px_80px_80px_90px] gap-2',
                  'w-full px-3 py-1.5 text-xs font-mono text-left',
                  'border-b border-slate-800/50 last:border-0',
                  'hover:bg-slate-900/50 transition-colors',
                  'items-center'
                )}
              >
                <span
                  className={cn(
                    'font-semibold',
                    METHOD_COLORS[entry.method] || 'text-slate-400'
                  )}
                >
                  {entry.method}
                </span>
                <span className="text-slate-300 truncate flex items-center gap-1">
                  {expandedId === entry.id ? (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  )}
                  {entry.url}
                </span>
                <span className={getStatusColor(entry.status)}>
                  {entry.status || '-'}
                </span>
                <span className="text-slate-400">
                  {formatDuration(entry.duration)}
                </span>
                <span className="text-slate-400">
                  {formatSize(entry.size)}
                </span>
                <span className="text-slate-600">
                  {formatTime(entry.timestamp)}
                </span>
              </button>

              {expandedId === entry.id && (
                <div className="px-6 py-3 bg-slate-900/30 border-b border-slate-800/50">
                  <p className="text-xs text-slate-500">
                    Request details will appear here when
                    intercepted by the widget.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
