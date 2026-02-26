'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Deployment {
  id: string
  app_name: string
  provider: string
  environment: string
  branch: string
  status: string
  commit_sha: string
  commit_message: string
  url: string
  created_at: string
}

const PROVIDER_STYLES: Record<string, string> = {
  vercel: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cloudflare: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  github: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const ENV_STYLES: Record<string, string> = {
  production: 'bg-green-500/20 text-green-400 border-green-500/30',
  preview: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  development: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-green-500/20 text-green-400 border-green-500/30',
  deployed: 'bg-green-500/20 text-green-400 border-green-500/30',
  building: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  queued: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const DEFAULT_BADGE = 'bg-slate-500/20 text-slate-400 border-slate-500/30'

function relativeTime(dateStr: string): string {
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

function shortSha(sha: string): string {
  return sha ? sha.slice(0, 7) : ''
}

function truncateMessage(msg: string, max = 50): string {
  if (!msg) return ''
  return msg.length > max ? `${msg.slice(0, max)}...` : msg
}

interface DeploymentTableProps {
  readonly deployments: readonly Deployment[]
}

export function DeploymentTable({ deployments }: DeploymentTableProps) {
  if (deployments.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No deployments found.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">App</TableHead>
          <TableHead className="text-muted-foreground">Provider</TableHead>
          <TableHead className="text-muted-foreground">Environment</TableHead>
          <TableHead className="text-muted-foreground">Branch</TableHead>
          <TableHead className="text-muted-foreground">Status</TableHead>
          <TableHead className="text-muted-foreground">Commit</TableHead>
          <TableHead className="text-muted-foreground">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deployments.map((d) => (
          <TableRow
            key={d.id}
            className="border-border hover:bg-accent/50"
          >
            <TableCell className="text-foreground font-medium">
              {d.url ? (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 hover:underline transition-colors"
                >
                  {d.app_name}
                </a>
              ) : (
                d.app_name
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs border',
                  PROVIDER_STYLES[d.provider?.toLowerCase()] ?? DEFAULT_BADGE
                )}
              >
                {d.provider}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs border',
                  ENV_STYLES[d.environment?.toLowerCase()] ?? DEFAULT_BADGE
                )}
              >
                {d.environment}
              </Badge>
            </TableCell>
            <TableCell className="text-foreground font-mono text-xs">
              {d.branch}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs border',
                  STATUS_STYLES[d.status?.toLowerCase()] ?? DEFAULT_BADGE
                )}
              >
                {d.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {d.commit_sha && (
                  <code className="text-xs text-muted-foreground font-mono">
                    {shortSha(d.commit_sha)}
                  </code>
                )}
                <span className="text-xs text-muted-foreground">
                  {truncateMessage(d.commit_message)}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {relativeTime(d.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function DeploymentTableSkeleton() {
  const rows = Array.from({ length: 5 }, (_, i) => i)

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">App</TableHead>
          <TableHead className="text-muted-foreground">Provider</TableHead>
          <TableHead className="text-muted-foreground">Environment</TableHead>
          <TableHead className="text-muted-foreground">Branch</TableHead>
          <TableHead className="text-muted-foreground">Status</TableHead>
          <TableHead className="text-muted-foreground">Commit</TableHead>
          <TableHead className="text-muted-foreground">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((i) => (
          <TableRow key={i} className="border-border">
            <TableCell>
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-14 bg-muted rounded-full animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
            </TableCell>
            <TableCell>
              <div className="h-4 w-14 bg-muted rounded animate-pulse" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
