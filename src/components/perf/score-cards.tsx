'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MetricName, PerfThreshold, Rating } from './types'
import { getRating, ALL_METRICS } from './types'

interface ScoreCardData {
  readonly metric: MetricName
  readonly value: number
  readonly rating: Rating
}

interface ScoreCardsProps {
  readonly entries: ReadonlyArray<{
    readonly title: string
    readonly content: string | null
    readonly metadata: string | null
  }>
  readonly thresholds: Readonly<Record<string, PerfThreshold>>
}

const METRIC_LABELS: Readonly<Record<MetricName, string>> = {
  LCP: 'Largest Contentful Paint',
  CLS: 'Cumulative Layout Shift',
  INP: 'Interaction to Next Paint',
  FCP: 'First Contentful Paint',
  TTFB: 'Time to First Byte',
}

const RATING_STYLES: Readonly<Record<string, {
  border: string
  badge: string
  text: string
  label: string
}>> = {
  good: {
    border: 'border-l-green-500',
    badge: 'bg-green-500/15 text-green-400 border-green-500/30',
    text: 'text-green-400',
    label: 'Good',
  },
  'needs-improvement': {
    border: 'border-l-yellow-500',
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    text: 'text-yellow-400',
    label: 'Needs Improvement',
  },
  poor: {
    border: 'border-l-red-500',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    text: 'text-red-400',
    label: 'Poor',
  },
}

function formatValue(metric: MetricName, value: number): string {
  if (metric === 'CLS') return value.toFixed(3)
  return `${Math.round(value)}`
}

function getLatestPerMetric(
  entries: ScoreCardsProps['entries'],
  thresholds: Readonly<Record<string, PerfThreshold>>
): ReadonlyArray<ScoreCardData | null> {
  return ALL_METRICS.map((metric) => {
    const matching = entries.filter((e) => e.title === metric)
    if (matching.length === 0) return null

    const latest = matching[0]
    const value = parseFloat(latest.content || '0')
    const meta = latest.metadata ? JSON.parse(latest.metadata) : null
    const rating = meta?.rating || getRating(value, thresholds[metric])

    return { metric, value, rating }
  })
}

export function ScoreCards({ entries, thresholds }: ScoreCardsProps) {
  const scores = getLatestPerMetric(entries, thresholds)

  return (
    <div className="grid grid-cols-5 gap-3">
      {ALL_METRICS.map((metric, i) => {
        const data = scores[i]
        const threshold = thresholds[metric]

        if (!data) {
          return (
            <Card
              key={metric}
              className={cn(
                'bg-card/50 border-border border-l-4',
                'border-l-border'
              )}
            >
              <CardContent className="pt-4 pb-4 px-4 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {metric}
                </p>
                <p className="text-lg font-mono text-muted-foreground">
                  No data
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {METRIC_LABELS[metric]}
                </p>
              </CardContent>
            </Card>
          )
        }

        const styles = RATING_STYLES[data.rating]

        return (
          <Card
            key={metric}
            className={cn(
              'bg-card/50 border-border border-l-4',
              styles.border
            )}
          >
            <CardContent className="pt-4 pb-4 px-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  {metric}
                </p>
                <Badge
                  className={cn(
                    'text-[10px] border',
                    styles.badge
                  )}
                >
                  {styles.label}
                </Badge>
              </div>
              <p className={cn('text-2xl font-mono font-bold', styles.text)}>
                {formatValue(metric, data.value)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {threshold.unit}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {METRIC_LABELS[metric]}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
