'use client'

import { useState, useCallback, memo } from 'react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format-date'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'

type Bug = {
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
}

export const BugCard = memo(function BugCard({ bug, onStatusChange, onDelete }: BugCardProps) {
  const [expanded, setExpanded] = useState(false)
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
          <span>{formatDate(bug.createdAt)}</span>
          {bug.pageUrl && (
            <a
              href={bug.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {bug.pageUrl}
            </a>
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
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

            <div className="flex justify-end">
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
          </div>
        )}
      </CardContent>
    </Card>
  )
})
