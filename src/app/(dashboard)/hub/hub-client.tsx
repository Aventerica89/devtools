'use client'

import { useEffect, useState } from 'react'
import { NotionPanel } from './notion-panel'
import { PlansPanel } from './plans-panel'

export function HubClient() {
  const [openBugs, setOpenBugs] = useState(0)
  const [kbCount, setKbCount] = useState(0)

  useEffect(() => {
    fetch('/api/bugs?status=open&limit=500').then((r) => r.json())
      .then((d) => setOpenBugs(Array.isArray(d) ? d.length : 0))
    fetch('/api/hub/kb').then((r) => r.json())
      .then((d) => setKbCount(Array.isArray(d) ? d.length : 0))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Bugs', value: openBugs },
          { label: 'KB Entries', value: kbCount },
        ].map((s) => (
          <div key={s.label} className="border border-border rounded-md p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold font-mono">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotionPanel />
        <PlansPanel />
      </div>
    </div>
  )
}
