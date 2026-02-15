'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EnvVar, Project } from './types'

type Props = {
  envVars: EnvVar[]
  projects: Project[]
  filterProjectId: string
  onFilterChange: (projectId: string) => void
  onDelete: (id: number) => void
}

export function EnvVarList({
  envVars,
  projects,
  filterProjectId,
  onFilterChange,
  onDelete,
}: Props) {
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const projectMap = new Map(projects.map((p) => [p.id, p.name]))

  const grouped = envVars.reduce<Record<string, EnvVar[]>>((acc, v) => {
    const key = v.projectId
    return { ...acc, [key]: [...(acc[key] || []), v] }
  }, {})

  function toggleReveal(id: number) {
    setRevealedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleCopy(id: number, value: string) {
    await navigator.clipboard.writeText(value)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleDelete(id: number) {
    if (confirmDeleteId === id) {
      onDelete(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  function maskValue(value: string): string {
    return '\u2022'.repeat(Math.min(value.length, 12))
  }

  const projectIds = Object.keys(grouped)

  return (
    <div className="space-y-4">
      {/* Project filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterProjectId}
          onChange={(e) => onFilterChange(e.target.value)}
          className={cn(
            'h-8 rounded-md border border-border',
            'bg-card text-foreground text-sm px-3',
            'focus:outline-none focus:ring-2 focus:ring-ring'
          )}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {envVars.length} variable{envVars.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grouped cards */}
      {projectIds.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Lock className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No environment variables</p>
          <p className="text-xs mt-1">
            Click &quot;Add Variable&quot; to create one
          </p>
        </div>
      ) : (
        projectIds.map((projectId) => (
          <Card
            key={projectId}
            className="bg-card border-border"
          >
            <CardHeader className="pb-0">
              <CardTitle className="text-sm text-foreground">
                {projectMap.get(projectId) || projectId}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Key</TableHead>
                    <TableHead className="text-muted-foreground">Value</TableHead>
                    <TableHead className="text-muted-foreground w-[200px]">
                      Description
                    </TableHead>
                    <TableHead className="text-muted-foreground w-[100px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped[projectId].map((envVar) => (
                    <TableRow
                      key={envVar.id}
                      className="border-border"
                    >
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1.5">
                          {envVar.key}
                          {envVar.sensitive && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0"
                            >
                              sensitive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <span className="text-muted-foreground">
                          {envVar.sensitive && !revealedIds.has(envVar.id)
                            ? maskValue(envVar.value)
                            : envVar.value}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {envVar.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {envVar.sensitive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleReveal(envVar.id)}
                            >
                              {revealedIds.has(envVar.id) ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              handleCopy(envVar.id, envVar.value)
                            }
                          >
                            {copiedId === envVar.id ? (
                              <Check className="h-3.5 w-3.5 text-green-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-7 w-7',
                              confirmDeleteId === envVar.id &&
                                'text-red-400'
                            )}
                            onClick={() => handleDelete(envVar.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
