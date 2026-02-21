'use client'

import { useEffect, useState, useRef } from 'react'
import { Copy, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KbEntry { id: string; title: string; type: string; snippet?: string; description?: string }
const FILTERS = ['All', 'Standards', 'Git', 'API', 'Deploy'] as const

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [entries, setEntries] = useState<KbEntry[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      fetch('/api/hub/kb').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setEntries(d) }).catch(() => {})
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setFilter('All')
    }
  }, [open])

  function copySnippet(entry: KbEntry) {
    navigator.clipboard.writeText(entry.snippet ?? entry.title)
    setCopied(entry.id)
    setTimeout(() => setCopied(null), 1500)
  }

  const filtered = entries.filter((e) => {
    const matchFilter = filter === 'All' || e.type === filter
    const matchQuery = !query ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      (e.snippet ?? '').toLowerCase().includes(query.toLowerCase())
    return matchFilter && matchQuery
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-background/80 backdrop-blur-sm"
      onClick={() => setOpen(false)}>
      <div className="w-full max-w-2xl bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <input ref={inputRef} value={query}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search knowledge base..."
            onChange={(e) => setQuery(e.target.value)} />
          <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="flex gap-1 px-4 py-2 border-b border-border">
          {FILTERS.map((f) => (
            <button key={f}
              className={cn('px-3 py-1 text-xs rounded-full', filter === f
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50')}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="max-h-96 overflow-auto">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-sm text-center text-muted-foreground">No results</p>
          )}
          {filtered.map((entry) => (
            <div key={entry.id}
              className="flex items-start justify-between px-4 py-3 hover:bg-accent/30 group">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-medium">{entry.title}</span>
                {entry.description && <span className="text-xs text-muted-foreground">{entry.description}</span>}
                {entry.snippet && (
                  <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono truncate max-w-sm">{entry.snippet}</code>
                )}
              </div>
              {entry.snippet && (
                <button className="ml-3 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => copySnippet(entry)}>
                  <Copy className={cn('h-4 w-4', copied === entry.id ? 'text-emerald-400' : 'text-muted-foreground')} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
