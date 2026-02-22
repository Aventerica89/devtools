'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KbEntry { id: string; title: string; type: string; description?: string; snippet?: string; lastEdited?: string }

const TYPE_COLORS: Record<string, string> = {
  Standards: 'bg-blue-500/15 text-blue-400',
  Git: 'bg-orange-500/15 text-orange-400',
  API: 'bg-purple-500/15 text-purple-400',
  Deploy: 'bg-emerald-500/15 text-emerald-400',
}

function renderMarkdown(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const newline = part.indexOf('\n')
      const code = newline === -1 ? part.slice(3, -3) : part.slice(newline + 1, -3)
      return (
        <pre key={i} className="text-xs bg-muted p-3 rounded font-mono whitespace-pre-wrap overflow-x-auto my-2">
          {code}
        </pre>
      )
    }
    return (
      <div key={i}>
        {part.split('\n').map((line, j) => {
          if (line.startsWith('# ')) return <h1 key={j} className="text-lg font-bold mt-4 mb-1">{line.slice(2)}</h1>
          if (line.startsWith('## ')) return <h2 key={j} className="text-base font-semibold mt-3 mb-1">{line.slice(3)}</h2>
          if (line.startsWith('### ')) return <h3 key={j} className="text-sm font-semibold mt-2 mb-1">{line.slice(4)}</h3>
          if (line.startsWith('• ')) return <li key={j} className="text-sm ml-4 list-disc">{line.slice(2)}</li>
          if (line.startsWith('[x] ')) return <div key={j} className="text-sm flex gap-2"><span>✓</span><span className="line-through text-muted-foreground">{line.slice(4)}</span></div>
          if (line.startsWith('[ ] ')) return <div key={j} className="text-sm flex gap-2"><span>☐</span><span>{line.slice(4)}</span></div>
          if (line.startsWith('> ')) return <blockquote key={j} className="text-sm border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground italic my-1">{line.slice(2)}</blockquote>
          if (line === '---') return <hr key={j} className="my-3 border-border" />
          if (line.trim() === '') return <div key={j} className="h-2" />
          return <p key={j} className="text-sm mb-1">{line}</p>
        })}
      </div>
    )
  })
}

export function NotionPanel() {
  const [entries, setEntries] = useState<KbEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<KbEntry | null>(null)
  const [blocks, setBlocks] = useState<string | null>(null)
  const [blocksLoading, setBlocksLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function load(refresh = false) {
    setLoading(true)
    try {
      const data = await fetch(`/api/hub/kb${refresh ? '?refresh=true' : ''}`).then((r) => r.json())
      setEntries(Array.isArray(data) ? data : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function openEntry(entry: KbEntry) {
    setSelected(entry)
    setBlocks(null)
    setBlocksLoading(true)
    try {
      const data = await fetch(`/api/hub/kb/${entry.id}`).then((r) => r.json())
      setBlocks(data.content ?? '')
    } catch {
      setBlocks('')
    } finally {
      setBlocksLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = entries.filter((e) =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.type.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="border border-border rounded-md flex flex-col" style={{ minHeight: 400 }}>
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
          onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex-1 overflow-auto">
        {loading && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
        {!loading && filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">No entries found.</p>}
        {filtered.map((entry) => (
          <div key={entry.id}
            className="flex items-start justify-between px-4 py-3 border-b border-border hover:bg-accent/30 cursor-pointer"
            onClick={() => openEntry(entry)}>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium truncate">{entry.title}</span>
              {entry.lastEdited && <span className="text-xs text-muted-foreground truncate">{new Date(entry.lastEdited).toLocaleDateString()}</span>}
              {entry.description && <span className="text-xs text-muted-foreground truncate">{entry.description}</span>}
            </div>
            <Badge className={cn('text-xs shrink-0 ml-2', TYPE_COLORS[entry.type] ?? '')} variant="outline">
              {entry.type}
            </Badge>
          </div>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setBlocks(null) } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {blocksLoading && <p className="text-sm text-muted-foreground">Loading content...</p>}
          {!blocksLoading && blocks !== null && blocks.trim() === '' && (
            <p className="text-sm text-muted-foreground italic">No content in this page.</p>
          )}
          {!blocksLoading && blocks && blocks.trim() !== '' && (
            <div className="mt-2">{renderMarkdown(blocks)}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
