'use client'

import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bug, ArrowRight, Clock } from 'lucide-react'

export interface BugSummary {
  readonly id: number
  readonly title: string
  readonly severity: string | null
  readonly status: string | null
  readonly createdAt: string | null
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const DEFAULT_BADGE = 'bg-slate-500/20 text-slate-400 border-slate-500/30'

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface RecentBugsProps {
  readonly bugs: readonly BugSummary[]
  readonly loading: boolean
}

function BugListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
        >
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-20 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-slate-800 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function RecentBugs({ bugs, loading }: RecentBugsProps) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bug className="h-4 w-4 text-red-400" />
          Recent Bugs
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bugs" className="text-slate-400 hover:text-white">
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <BugListSkeleton />
        ) : bugs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Bug className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No bugs reported</p>
          </div>
        ) : (
          <div className="space-y-1">
            {bugs.map((bug) => (
              <div
                key={bug.id}
                className={cn(
                  'flex items-center justify-between py-2.5',
                  'border-b border-slate-800/50 last:border-0'
                )}
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm text-white truncate">{bug.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span className="text-xs text-slate-500">
                      {relativeTime(bug.createdAt)}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs border capitalize shrink-0',
                    SEVERITY_STYLES[bug.severity ?? ''] ?? DEFAULT_BADGE
                  )}
                >
                  {bug.severity ?? 'unknown'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
