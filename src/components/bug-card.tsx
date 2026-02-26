'use client'

import { useState, useCallback, memo } from 'react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format-date'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from '@/components/ui/card'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Pencil,
  X,
  Save,
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'

export type Bug = {
  id: number
  projectId: string
  title: string
  description: string | null
  severity: string | null
  status: string | null
  screenshotUrl: string | null
  stackTrace: string | null
  pageUrl: string | null
  userAgent: string | null
  metadata: string | null
  createdAt: string | null
  resolvedAt: string | null
}

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-900/50 text-red-300 border-red-700',
  high: 'bg-orange-900/50 text-orange-300 border-orange-700',
  medium: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  low: 'bg-blue-900/50 text-blue-300 border-blue-700',
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  'in-progress': 'bg-purple-900/50 text-purple-300 border-purple-700',
  resolved: 'bg-accent/50 text-muted-foreground border-border',
}

const STATUS_CYCLE: Record<string, string> = {
  open: 'in-progress',
  'in-progress': 'resolved',
  resolved: 'open',
}

type BugCardProps = {
  bug: Bug
  onStatusChange: (id: number, status: string) => void
  onDelete: (id: number) => void
  onUpdate?: (id: number, data: { title: string; description: string | null; severity: string }) => void
}

export const BugCard = memo(function BugCard({
  bug,
  onStatusChange,
  onDelete,
  onUpdate,
}: BugCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(bug.title)
  const [editDesc, setEditDesc] = useState(bug.description || '')
  const [editSeverity, setEditSeverity] = useState(bug.severity || 'medium')
  const severity = bug.severity || 'medium'
  const status = bug.status || 'open'

  const handleToggleExpand = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const handleStatusChange = useCallback(() => {
    onStatusChange(bug.id, STATUS_CYCLE[status] || 'open')
  }, [bug.id, status, onStatusChange])

  const handleDelete = useCallback(() => {
    onDelete(bug.id)
  }, [bug.id, onDelete])

  const handleStartEdit = useCallback(() => {
    setEditTitle(bug.title)
    setEditDesc(bug.description || '')
    setEditSeverity(bug.severity || 'medium')
    setEditing(true)
  }, [bug.title, bug.description, bug.severity])

  const handleCancelEdit = useCallback(() => {
    setEditing(false)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) return
    if (onUpdate) {
      onUpdate(bug.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        severity: editSeverity,
      })
    }
    setEditing(false)
  }, [bug.id, editTitle, editDesc, editSeverity, onUpdate])

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm text-foreground flex items-center gap-2 min-w-0">
          <Badge
            className={cn(
              'text-[10px] uppercase border shrink-0',
              SEVERITY_STYLES[severity]
            )}
          >
            {severity}
          </Badge>
          <span className="truncate" title={bug.title}>{bug.title}</span>
        </CardTitle>
        <CardAction>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              className={cn(
                'text-[10px] uppercase border rounded-full px-2',
                STATUS_STYLES[status]
              )}
              onClick={handleStatusChange}
            >
              {status}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleToggleExpand}
              className="text-muted-foreground"
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0 -mt-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{formatDate(bug.createdAt)}</span>
          {bug.pageUrl && (
            <a
              href={bug.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono flex items-center gap-1 hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {bug.pageUrl}
            </a>
          )}
          {bug.metadata && (() => {
            try {
              const meta = JSON.parse(bug.metadata)
              if (meta.fromErrorId) {
                return (
                  <span className="flex items-center gap-1 text-blue-400">
                    <LinkIcon className="h-3 w-3" />
                    From error #{meta.fromErrorId}
                  </span>
                )
              }
            } catch { /* ignore */ }
            return null
          })()}
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Title</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-background border-border text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className={cn(
                      'w-full rounded-md border border-border',
                      'bg-background text-foreground text-sm p-3',
                      'focus:outline-none focus:ring-2 focus:ring-ring',
                      'resize-none'
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Severity</label>
                  <div className="flex gap-2">
                    {SEVERITIES.map((s) => (
                      <Button
                        key={s}
                        variant={editSeverity === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEditSeverity(s)}
                        className="capitalize text-xs"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="xs" onClick={handleCancelEdit}>
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                  <Button size="xs" onClick={handleSaveEdit} disabled={!editTitle.trim()}>
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {bug.description && (
                  <p className="text-sm text-foreground">{bug.description}</p>
                )}

                {bug.stackTrace && (
                  <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto text-red-400 border border-border">
                    {bug.stackTrace}
                  </pre>
                )}

                {bug.userAgent && (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-muted-foreground">UA:</span> {bug.userAgent}
                  </p>
                )}

                {bug.screenshotUrl && (
                  <a
                    href={bug.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    View Screenshot
                  </a>
                )}

                {bug.resolvedAt && (
                  <p className="text-xs text-muted-foreground">
                    Resolved: {formatDate(bug.resolvedAt)}
                  </p>
                )}

                <div className="flex justify-end gap-1">
                  {onUpdate && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={handleStartEdit}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-red-400 hover:text-red-300"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})
