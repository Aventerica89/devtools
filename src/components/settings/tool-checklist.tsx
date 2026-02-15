'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Terminal,
  Globe,
  AlertTriangle,
  Bug,
  Bot,
  Gauge,
} from 'lucide-react'

const AVAILABLE_TOOLS = [
  { id: 'console', label: 'Console', icon: Terminal },
  { id: 'network', label: 'Network', icon: Globe },
  { id: 'errors', label: 'Errors', icon: AlertTriangle },
  { id: 'bugs', label: 'Bugs', icon: Bug },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'performance', label: 'Performance', icon: Gauge },
] as const

type ToolChecklistProps = {
  readonly enabledTools: ReadonlyArray<string>
  readonly onChange: (tools: ReadonlyArray<string>) => void
}

export function ToolChecklist({
  enabledTools,
  onChange,
}: ToolChecklistProps) {
  function handleToggle(toolId: string, checked: boolean) {
    const updated = checked
      ? [...enabledTools, toolId]
      : enabledTools.filter((t) => t !== toolId)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {AVAILABLE_TOOLS.map((tool) => {
        const isEnabled = enabledTools.includes(tool.id)

        return (
          <div
            key={tool.id}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-3">
              <tool.icon className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm text-foreground cursor-pointer">
                {tool.label}
              </Label>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => handleToggle(tool.id, checked)}
            />
          </div>
        )
      })}
    </div>
  )
}
