'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Upload, ExternalLink } from 'lucide-react'

interface Plan { title: string; project: string; status: string; date: string }

const STATUS_COLORS: Record<string, string> = {
  Approved: 'bg-emerald-500/15 text-emerald-400',
  Draft: 'bg-yellow-500/15 text-yellow-400',
  Complete: 'bg-blue-500/15 text-blue-400',
  'in progress': 'bg-emerald-500/15 text-emerald-400',
  complete: 'bg-blue-500/15 text-blue-400',
  paused: 'bg-yellow-500/15 text-yellow-400',
}

export function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [available, setAvailable] = useState<boolean | null>(null)
  const [source, setSource] = useState<'local' | 'cache' | null>(null)
  const [hasHtml, setHasHtml] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/hub/plans').then((r) => r.json()).then((data) => {
      setAvailable(data.available)
      setSource(data.source ?? null)
      setHasHtml(data.hasHtml ?? false)
      if (data.available) setPlans(data.plans ?? [])
    }).catch(() => setAvailable(false))
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/hub/plans/upload', { method: 'POST', body })
      if (res.ok) {
        setHasHtml(true)
        // Also refresh the list
        const data = await fetch('/api/hub/plans').then((r) => r.json())
        setAvailable(data.available)
        setSource(data.source ?? null)
        setHasHtml(data.hasHtml ?? true)
        if (data.available) setPlans(data.plans ?? [])
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="border border-border rounded-md flex flex-col" style={{ minHeight: 400 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Plans Index</h2>
        <div className="flex items-center gap-1">
          {hasHtml && (
            <Button variant="ghost" size="icon" className="h-6 w-6" title="View HTML" onClick={() => setViewOpen(true)}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Upload plans-index.html"
            disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="h-3 w-3" />
          </Button>
          <input ref={fileRef} type="file" accept=".html,text/html" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {available === null && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
        {available === false && (
          <p className="p-4 text-sm text-muted-foreground">
            No plans cached.{' '}
            <button className="underline underline-offset-2" onClick={() => fileRef.current?.click()}>
              Upload plans-index.html
            </button>
          </p>
        )}
        {available && source && (
          <p className="px-4 py-2 text-xs text-muted-foreground/50 border-b border-border">
            {source === 'local' ? 'Serving: ~/Desktop/plans-index.html (local dev)' : 'Serving from cache'}
          </p>
        )}
        {available && plans.map((plan) => (
          <div key={`${plan.title}:${plan.project}`} className="flex items-start justify-between px-4 py-3 border-b border-border">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium truncate">{plan.title}</span>
              <span className="text-xs text-muted-foreground">{plan.project} · {plan.date}</span>
            </div>
            <Badge className={`text-xs shrink-0 ml-2 ${STATUS_COLORS[plan.status] ?? 'text-muted-foreground'}`} variant="outline">
              {plan.status}
            </Badge>
          </div>
        ))}
        {available && plans.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No plans found.</p>
        )}
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col">
          <iframe
            src="/api/hub/plans/html"
            className="flex-1 w-full border-0"
            sandbox="allow-same-origin allow-scripts"
            title="Plans Index"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
