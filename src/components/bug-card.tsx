'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
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
  resolved: 'bg-slate-700/50 text-slate-400 border-slate-600',
}

const STATUS_CYCLE: Record<string, string> = {
  open: 'in-progress',
  'in-progress': 'resolved',
  resolved: 'open',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type BugCardProps = {
  bug: Bug
  onStatusChange: (id: number, status: string) => void
  onDelete: (id: number) => void
}

export function BugCard({ bug, onStatusChange, onDelete }: BugCardProps) {
  const [expanded, setExpanded] = useState(false)
  const severity = bug.severity || 'medium'
  const status = bug.status || 'open'

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <Badge
            className={cn(
              'text-[10px] uppercase border',
              SEVERITY_STYLES[severity]
            )}
          >
            {severity}
          </Badge>
          <span className="truncate">{bug.title}</span>
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
              onClick={() =>
                onStatusChange(bug.id, STATUS_CYCLE[status] || 'open')
              }
            >
              {status}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setExpanded((prev) => !prev)}
              className="text-slate-400"
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
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{formatDate(bug.createdAt)}</span>
          {bug.pageUrl && (
            <a
              href={bug.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-slate-300"
            >
              <ExternalLink className="h-3 w-3" />
              {bug.pageUrl}
            </a>
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            {bug.description && (
              <p className="text-sm text-slate-300">{bug.description}</p>
            )}

            {bug.stackTrace && (
              <pre className="text-xs bg-slate-950 p-3 rounded-md overflow-x-auto text-red-400 border border-slate-800">
                {bug.stackTrace}
              </pre>
            )}

            {bug.userAgent && (
              <p className="text-xs text-slate-500">
                <span className="text-slate-400">UA:</span> {bug.userAgent}
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
              <p className="text-xs text-slate-500">
                Resolved: {formatDate(bug.resolvedAt)}
              </p>
            )}

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="xs"
                className="text-red-400 hover:text-red-300"
                onClick={() => onDelete(bug.id)}
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
}
