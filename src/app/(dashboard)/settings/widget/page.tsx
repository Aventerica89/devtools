'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Puzzle,
  Save,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToolChecklist } from '@/components/settings/tool-checklist'

type Project = {
  id: string
  name: string
  url: string | null
  createdAt: string | null
}

type WidgetConfig = {
  enabledTools: string[]
  theme: string
  position: string
}

const POSITIONS = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
] as const

const THEMES = ['dark', 'light'] as const

const DEFAULT_CONFIG: WidgetConfig = {
  enabledTools: ['console', 'network', 'errors', 'bugs', 'ai'],
  theme: 'dark',
  position: 'bottom-right',
}

export default function WidgetSettingsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data)
    if (data.length > 0 && !selectedProjectId) {
      setSelectedProjectId(data[0].id)
    }
  }, [selectedProjectId])

  const fetchConfig = useCallback(async (projectId: string) => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/widget/config/${projectId}`)
      const data = await res.json()
      setConfig({
        enabledTools: data.enabledTools ?? DEFAULT_CONFIG.enabledTools,
        theme: data.theme ?? DEFAULT_CONFIG.theme,
        position: data.position ?? DEFAULT_CONFIG.position,
      })
    } catch {
      setConfig(DEFAULT_CONFIG)
    }
  }, [])

  useEffect(() => {
    fetchProjects().then(() => setLoading(false))
  }, [fetchProjects])

  useEffect(() => {
    if (selectedProjectId) {
      fetchConfig(selectedProjectId)
    }
  }, [selectedProjectId, fetchConfig])

  async function handleSave() {
    if (!selectedProjectId) return

    setSaving(true)
    setSaveStatus('idle')

    try {
      await fetch('/api/widget/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          enabledTools: config.enabledTools,
          theme: config.theme,
          position: config.position,
        }),
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading widget config...
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Puzzle className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No projects available</p>
        <p className="text-xs mt-1">
          Create a project in Project Settings first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Configure the widget appearance and enabled tools per project.
      </p>

      {/* Project selector */}
      <div className="space-y-2">
        <Label>Project</Label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className={cn(
            'w-full max-w-sm h-9 rounded-md border border-slate-700',
            'bg-slate-950 text-white text-sm px-3',
            'focus:outline-none focus:ring-2 focus:ring-ring'
          )}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enabled tools */}
        <div className="border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-medium text-white">Enabled Tools</h3>
          <ToolChecklist
            enabledTools={config.enabledTools}
            onChange={(tools) =>
              setConfig({ ...config, enabledTools: [...tools] })
            }
          />
        </div>

        {/* Theme + Position + PIN */}
        <div className="space-y-4">
          {/* Theme */}
          <div className="border border-slate-800 rounded-lg p-5 space-y-3">
            <h3 className="font-medium text-white">Theme</h3>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <Button
                  key={t}
                  variant={config.theme === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setConfig({ ...config, theme: t })}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="border border-slate-800 rounded-lg p-5 space-y-3">
            <h3 className="font-medium text-white">Position</h3>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.map((pos) => (
                <Button
                  key={pos}
                  variant={config.position === pos ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setConfig({ ...config, position: pos })}
                  className="text-xs"
                >
                  {pos}
                </Button>
              ))}
            </div>
          </div>

          {/* PIN management */}
          <div className="border border-slate-800 rounded-lg p-5 space-y-3">
            <h3 className="font-medium text-white">PIN Hash</h3>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="font-mono text-xs bg-slate-800 text-slate-300"
              >
                ****...****
              </Badge>
              <Button size="sm" variant="outline" disabled>
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              PIN regeneration will be available in a future update.
            </p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Configuration
        </Button>
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1.5 text-green-400 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </div>
  )
}
