'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Play, ChevronDown, ChevronRight, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Checklist { id: number; projectId: string; name: string; description?: string | null; sortOrder: number }
interface Item { id: number; checklistId: number; name: string; type: string; snippet?: string | null; notes?: string | null; sortOrder: number }
interface RunItem { id: number; itemId: number; checked: number; checkedAt?: string | null }
interface Run { id: number; checklistId: number; startedAt: string; completedAt?: string | null; items?: RunItem[] }

const TYPE_COLORS: Record<string, string> = {
  health: 'bg-emerald-500/15 text-emerald-400',
  maintenance: 'bg-blue-500/15 text-blue-400',
  'pre-deploy': 'bg-orange-500/15 text-orange-400',
  workflow: 'bg-purple-500/15 text-purple-400',
}

interface Props { checklist: Checklist; onUpdate: (c: Checklist) => void }

export function ChecklistEditor({ checklist }: Props) {
  const [activeTab, setActiveTab] = useState<'items' | 'history'>('items')
  const [items, setItems] = useState<Item[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [expandedRun, setExpandedRun] = useState<number | null>(null)
  const [expandedRunData, setExpandedRunData] = useState<Record<number, Run>>({})

  useEffect(() => {
    fetch(`/api/routines/${checklist.id}/items`).then((r) => r.json()).then(setItems)
    fetch(`/api/routines/${checklist.id}/runs`).then((r) => r.json()).then(setRuns)
  }, [checklist.id])

  async function addItem() {
    const name = prompt('Item name:')
    if (!name) return
    const res = await fetch(`/api/routines/${checklist.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sortOrder: items.length }),
    })
    if (res.ok) {
      const newItem: Item = await res.json()
      setItems((prev) => [...prev, newItem])
    }
  }

  async function deleteItem(id: number) {
    await fetch(`/api/routines/items/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function startRun() {
    const res = await fetch(`/api/routines/${checklist.id}/runs`, { method: 'POST' })
    if (res.ok) {
      const run: Run = await res.json()
      setRuns((prev) => [run, ...prev])
      setActiveTab('history')
    }
  }

  async function expandRun(runId: number) {
    if (expandedRun === runId) { setExpandedRun(null); return }
    setExpandedRun(runId)
    if (!expandedRunData[runId]) {
      const data: Run = await fetch(`/api/routines/runs/${runId}`).then((r) => r.json())
      setExpandedRunData((prev) => ({ ...prev, [runId]: data }))
    }
  }

  async function toggleRunItem(runId: number, itemId: number, checked: boolean) {
    await fetch(`/api/routines/runs/${runId}/items?itemId=${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked }),
    })
    setExpandedRunData((prev) => ({
      ...prev,
      [runId]: {
        ...prev[runId],
        items: prev[runId]?.items?.map((i) =>
          i.itemId === itemId ? { ...i, checked: checked ? 1 : 0 } : i
        ),
      },
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{checklist.name}</h2>
        <Button size="sm" onClick={startRun}><Play className="h-3 w-3 mr-1" /> Start Run</Button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['items', 'history'] as const).map((tab) => (
          <button key={tab}
            className={cn('px-4 py-2 text-sm capitalize', activeTab === tab
              ? 'border-b-2 border-foreground text-foreground'
              : 'text-muted-foreground hover:text-foreground')}
            onClick={() => setActiveTab(tab)}
          >{tab}</button>
        ))}
      </div>

      {activeTab === 'items' && (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="border border-border rounded-md p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  <Badge className={cn('text-xs shrink-0', TYPE_COLORS[item.type] ?? '')} variant="outline">
                    {item.type}
                  </Badge>
                </div>
                <button onClick={() => deleteItem(item.id)}>
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              {item.snippet && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono truncate">{item.snippet}</code>
                  <button onClick={() => navigator.clipboard.writeText(item.snippet ?? '')}>
                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
              {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
          <Button size="sm" variant="outline" onClick={addItem} className="self-start">
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex flex-col gap-2">
          {runs.map((run) => {
            const runData = expandedRunData[run.id]
            const total = runData?.items?.length ?? 0
            const checked = runData?.items?.filter((i) => i.checked).length ?? 0
            return (
              <div key={run.id} className="border border-border rounded-md overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50"
                  onClick={() => expandRun(run.id)}
                >
                  <div className="flex items-center gap-3 text-sm">
                    {expandedRun === run.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span>{new Date(run.startedAt).toLocaleString()}</span>
                    {run.completedAt && <Badge variant="outline" className="text-xs text-emerald-400">Complete</Badge>}
                  </div>
                  {runData && <span className="text-xs text-muted-foreground">{checked}/{total}</span>}
                </button>
                {expandedRun === run.id && runData?.items && (
                  <div className="border-t border-border p-3 flex flex-col gap-2">
                    {runData.items.map((runItem) => {
                      const item = items.find((i) => i.id === runItem.itemId)
                      return (
                        <div key={runItem.id} className="flex items-center gap-3 text-sm">
                          <input type="checkbox" checked={runItem.checked === 1}
                            onChange={(e) => toggleRunItem(run.id, runItem.itemId, e.target.checked)} />
                          <span className={runItem.checked ? 'line-through text-muted-foreground' : ''}>
                            {item?.name ?? `Item ${runItem.itemId}`}
                          </span>
                          {runItem.checkedAt && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(runItem.checkedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {runs.length === 0 && <p className="text-sm text-muted-foreground">No runs yet. Click Start Run.</p>}
        </div>
      )}
    </div>
  )
}
