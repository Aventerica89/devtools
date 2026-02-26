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
import {
  Activity,
  ArrowRight,
  Clock,
  AlertTriangle,
  ScrollText,
  Gauge,
  Bug,
  Wrench,
  Terminal,
  Globe,
  type LucideIcon,
} from 'lucide-react'

export interface DevlogEntry {
  readonly id: number
  readonly type: string
  readonly title: string
  readonly source: string | null
  readonly createdAt: string | null
}

const TYPE_META: Record<string, { icon: LucideIcon; color: string; href: string }> = {
  error: { icon: AlertTriangle, color: 'text-red-400', href: '/errors' },
  note: { icon: ScrollText, color: 'text-blue-400', href: '/devlog' },
  perf: { icon: Gauge, color: 'text-emerald-400', href: '/perf' },
  bug: { icon: Bug, color: 'text-orange-400', href: '/bugs' },
  fix: { icon: Wrench, color: 'text-green-400', href: '/devlog' },
  console: { icon: Terminal, color: 'text-foreground', href: '/console' },
  network: { icon: Globe, color: 'text-emerald-400', href: '/network' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', href: '/devlog' },
}

const DEFAULT_TYPE_META = { icon: Activity, color: 'text-muted-foreground', href: '/devlog' }

const SOURCE_STYLES: Record<string, string> = {
  manual: 'bg-muted text-muted-foreground border-border',
  widget: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  api: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  ci: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const DEFAULT_SOURCE = 'bg-muted text-muted-foreground border-border'

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

interface RecentActivityProps {
  readonly entries: readonly DevlogEntry[]
  readonly loading: boolean
}

function ActivityListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-2 border-b border-border last:border-0"
        >
          <div className="h-7 w-7 rounded bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function RecentActivity({ entries, loading }: RecentActivityProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          Recent Activity
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/devlog" className="text-muted-foreground hover:text-foreground">
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ActivityListSkeleton />
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => {
              const meta = TYPE_META[entry.type] ?? DEFAULT_TYPE_META
              const TypeIcon = meta.icon

              return (
                <Link
                  key={entry.id}
                  href={meta.href}
                  className={cn(
                    'flex items-center gap-3 py-2.5',
                    'border-b border-border/50 last:border-0',
                    'hover:bg-accent/50 rounded-md px-1 -mx-1 transition-colors'
                  )}
                >
                  <div
                    className={cn(
                      'h-7 w-7 rounded flex items-center justify-center shrink-0',
                      'bg-muted/50'
                    )}
                  >
                    <TypeIcon className={cn('h-3.5 w-3.5', meta.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{entry.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {relativeTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                  {entry.source && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs border shrink-0',
                        SOURCE_STYLES[entry.source] ?? DEFAULT_SOURCE
                      )}
                    >
                      {entry.source}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
