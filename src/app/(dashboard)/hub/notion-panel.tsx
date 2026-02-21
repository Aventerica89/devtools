'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KbEntry { id: string; title: string; type: string; description?: string; snippet?: string }

const TYPE_COLORS: Record<string, string> = {
  Standards: 'bg-blue-500/15 text-blue-400',
  Git: 'bg-orange-500/15 text-orange-400',
  API: 'bg-purple-500/15 text-purple-400',
  Deploy: 'bg-emerald-500/15 text-emerald-400',
}

export function NotionPanel() {
  const [entries, setEntries] = useState<KbEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<KbEntry | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load(refresh = false) {
    setLoading(true)
    const data = await fetch(`/api/hub/kb${refresh ? '?refresh=true' : ''}`).then((r) => r.json())
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  const filtered = entries.filter((e) =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.type.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="border border-border rounded-md flex flex-col relative" style={{ minHeight: 400 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Knowledge Base</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6"
          onClick={() => { setRefreshing(true); load(true) }} disabled={refreshing}>
          <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
        </Button>
      </div>
      <div className="px-4 py-2 border-b border-border">
        <input placeholder="Search..." value={search}
          className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)} />
      </div>
      <div className="flex-1 overflow-auto">
        {loading && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
        {!loading && filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">No entries found.</p>}
        {filtered.map((entry) => (
          <div key={entry.id}
            className="flex items-start justify-between px-4 py-3 border-b border-border hover:bg-accent/30 cursor-pointer"
            onClick={() => setSelected(entry)}>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium truncate">{entry.title}</span>
              {entry.description && <span className="text-xs text-muted-foreground truncate">{entry.description}</span>}
            </div>
            <Badge className={cn('text-xs shrink-0 ml-2', TYPE_COLORS[entry.type] ?? '')} variant="outline">
              {entry.type}
            </Badge>
          </div>
        ))}
      </div>
      {selected && (
        <div className="absolute inset-0 bg-background/95 z-10 flex flex-col p-6 overflow-auto rounded-md">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-base font-semibold">{selected.title}</h3>
            <button onClick={() => setSelected(null)}><X className="h-4 w-4" /></button>
          </div>
          {selected.description && <p className="text-sm text-muted-foreground mb-4">{selected.description}</p>}
          {selected.snippet && (
            <pre className="text-xs bg-muted p-4 rounded font-mono whitespace-pre-wrap">{selected.snippet}</pre>
          )}
        </div>
      )}
    </div>
  )
}
