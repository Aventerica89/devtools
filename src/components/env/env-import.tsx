'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from './types'

type ParsedVar = {
  key: string
  value: string
}

type Props = {
  projects: Project[]
  onImport: (
    projectId: string,
    vars: ParsedVar[],
    sensitive: boolean
  ) => Promise<void>
}

function parseEnvText(text: string): ParsedVar[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const eqIndex = line.indexOf('=')
      if (eqIndex === -1) return null
      const key = line.slice(0, eqIndex).trim()
      let value = line.slice(eqIndex + 1).trim()
      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!key) return null
      return { key, value }
    })
    .filter((v): v is ParsedVar => v !== null)
}

export function EnvImport({ projects, onImport }: Props) {
  const [text, setText] = useState('')
  const [projectId, setProjectId] = useState('')
  const [sensitive, setSensitive] = useState(false)
  const [importing, setImporting] = useState(false)
  const [success, setSuccess] = useState(false)

  const parsed = parseEnvText(text)

  async function handleImport() {
    if (!projectId || parsed.length === 0) return
    setImporting(true)
    try {
      await onImport(projectId, parsed, sensitive)
      setText('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">
            Bulk Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Project</Label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={cn(
                'w-full h-9 rounded-md border border-border',
                'bg-background text-foreground text-sm px-3',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>
              Paste .env format
            </Label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                '# Comments are ignored\n'
                + 'DATABASE_URL=postgres://...\n'
                + 'API_KEY="sk-abc123"\n'
                + 'DEBUG=true'
              }
              rows={8}
              className={cn(
                'w-full rounded-md border border-border',
                'bg-background text-foreground text-sm p-3 font-mono',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'resize-none'
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={sensitive}
              onCheckedChange={setSensitive}
            />
            <Label className="text-sm text-muted-foreground">
              Mark all as sensitive
            </Label>
          </div>

          {/* Preview */}
          {parsed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Preview: {parsed.length} variable
                {parsed.length !== 1 ? 's' : ''} detected
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.map((v) => (
                  <Badge
                    key={v.key}
                    variant="secondary"
                    className="font-mono text-xs"
                  >
                    {v.key}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleImport}
              disabled={!projectId || parsed.length === 0 || importing}
              size="sm"
            >
              {importing ? (
                'Importing...'
              ) : success ? (
                <>
                  <Check className="h-4 w-4" />
                  Imported
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {parsed.length} Variable
                  {parsed.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
            {success && (
              <span className="text-xs text-green-400">
                Variables imported successfully
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
