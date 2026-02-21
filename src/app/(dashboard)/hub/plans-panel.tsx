'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface Plan { title: string; project: string; status: string; date: string }
const STATUS_COLORS: Record<string, string> = {
  Approved: 'bg-emerald-500/15 text-emerald-400',
  Draft: 'bg-yellow-500/15 text-yellow-400',
  Complete: 'bg-blue-500/15 text-blue-400',
}

export function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [available, setAvailable] = useState<boolean | null>(null)
  const [reason, setReason] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/hub/plans').then((r) => r.json()).then((data) => {
      setAvailable(data.available)
      setReason(data.reason ?? null)
      if (data.available) setPlans(data.plans ?? [])
    }).catch(() => setAvailable(false))
  }, [])

  return (
    <div className="border border-border rounded-md flex flex-col" style={{ minHeight: 400 }}>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Plans Index</h2>
      </div>
      <div className="flex-1 overflow-auto">
        {available === null && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
        {available === false && (
          <div className="p-4 text-sm text-muted-foreground">
            <p>Local file — not available in production.</p>
            {reason && <p className="text-xs mt-1 opacity-60">{reason}</p>}
          </div>
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
          <p className="p-4 text-sm text-muted-foreground">No plans found in ~/Desktop/plans-index.html</p>
        )}
      </div>
    </div>
  )
}
