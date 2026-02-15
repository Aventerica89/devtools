'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  FolderKanban,
  Bug,
  AlertTriangle,
  Gauge,
  type LucideIcon,
} from 'lucide-react'

interface StatItem {
  readonly label: string
  readonly value: string | number
  readonly icon: LucideIcon
  readonly color: string
  readonly bgColor: string
}

function buildStatItems(stats: DashboardStats): readonly StatItem[] {
  return [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderKanban,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Open Bugs',
      value: stats.openBugs,
      icon: Bug,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Recent Errors',
      value: stats.recentErrors,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Perf Score',
      value: stats.perfScore ?? '--',
      icon: Gauge,
      color: stats.perfScoreColor,
      bgColor: 'bg-emerald-500/10',
    },
  ] as const
}

export interface DashboardStats {
  readonly totalProjects: number
  readonly openBugs: number
  readonly recentErrors: number
  readonly perfScore: string | null
  readonly perfScoreColor: string
}

interface StatCardsProps {
  readonly stats: DashboardStats
  readonly loading: boolean
}

function StatCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-6 w-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatCards({ stats, loading }: StatCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const items = buildStatItems(stats)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="bg-card border-border">
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center',
                  item.bgColor
                )}
              >
                <item.icon className={cn('h-5 w-5', item.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={cn('text-2xl font-bold', item.color)}>
                  {item.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
