'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { PerfEntry, PageMetrics, Rating, PerfThreshold } from './types'
import { getRating } from './types'

interface PageBreakdownProps {
  readonly entries: readonly PerfEntry[]
  readonly thresholds: Readonly<Record<string, PerfThreshold>>
}

const RATING_ORDER: Readonly<Record<Rating, number>> = {
  poor: 0,
  'needs-improvement': 1,
  good: 2,
}

const RATING_BADGE_STYLES: Readonly<Record<Rating, string>> = {
  good: 'bg-green-500/15 text-green-400 border-green-500/30',
  'needs-improvement': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  poor: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const RATING_LABELS: Readonly<Record<Rating, string>> = {
  good: 'Good',
  'needs-improvement': 'Needs Work',
  poor: 'Poor',
}

function parsePageUrl(metadata: string | null): string | null {
  if (!metadata) return null
  try {
    const parsed = JSON.parse(metadata)
    return parsed.url || parsed.pageUrl || parsed.page || null
  } catch {
    return null
  }
}

function computePageMetrics(
  entries: readonly PerfEntry[],
  thresholds: Readonly<Record<string, PerfThreshold>>
): readonly PageMetrics[] {
  // Group entries by page URL
  const pageMap = new Map<string, Map<string, number[]>>()

  for (const entry of entries) {
    const url = parsePageUrl(entry.metadata)
    if (!url || !entry.content) continue

    const value = parseFloat(entry.content)
    if (isNaN(value)) continue

    if (!pageMap.has(url)) {
      pageMap.set(url, new Map())
    }
    const metricMap = pageMap.get(url)!
    if (!metricMap.has(entry.title)) {
      metricMap.set(entry.title, [])
    }
    metricMap.get(entry.title)!.push(value)
  }

  // Compute averages per page
  const pages: PageMetrics[] = []

  for (const [url, metricMap] of pageMap) {
    const avgOf = (metric: string): number | null => {
      const values = metricMap.get(metric)
      if (!values || values.length === 0) return null
      return values.reduce((sum, v) => sum + v, 0) / values.length
    }

    const lcp = avgOf('LCP')
    const cls = avgOf('CLS')
    const inp = avgOf('INP')
    const fcp = avgOf('FCP')
    const ttfb = avgOf('TTFB')

    // Determine worst rating across all available metrics
    const ratings: Rating[] = []
    if (lcp !== null) ratings.push(getRating(lcp, thresholds.LCP))
    if (cls !== null) ratings.push(getRating(cls, thresholds.CLS))
    if (inp !== null) ratings.push(getRating(inp, thresholds.INP))
    if (fcp !== null) ratings.push(getRating(fcp, thresholds.FCP))
    if (ttfb !== null) ratings.push(getRating(ttfb, thresholds.TTFB))

    const worstRating: Rating = ratings.length > 0
      ? ratings.reduce((worst, r) =>
          RATING_ORDER[r] < RATING_ORDER[worst] ? r : worst
        )
      : 'good'

    pages.push({ url, lcp, cls, inp, fcp, ttfb, worstRating })
  }

  // Sort by worst rating first
  return [...pages].sort(
    (a, b) => RATING_ORDER[a.worstRating] - RATING_ORDER[b.worstRating]
  )
}

function formatMetricValue(
  value: number | null,
  metric: string,
  thresholds: Readonly<Record<string, PerfThreshold>>
): { display: string; rating: Rating } | null {
  if (value === null) return null
  const threshold = thresholds[metric]
  const rating = getRating(value, threshold)
  const display = metric === 'CLS'
    ? value.toFixed(3)
    : `${Math.round(value)}${threshold.unit}`
  return { display, rating }
}

const VALUE_COLORS: Readonly<Record<Rating, string>> = {
  good: 'text-green-400',
  'needs-improvement': 'text-yellow-400',
  poor: 'text-red-400',
}

export function PageBreakdown({ entries, thresholds }: PageBreakdownProps) {
  const pages = computePageMetrics(entries, thresholds)

  if (pages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No per-page data available. Page URLs are extracted
        from metadata sent by the widget.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">Page URL</TableHead>
          <TableHead className="text-muted-foreground text-right">LCP</TableHead>
          <TableHead className="text-muted-foreground text-right">CLS</TableHead>
          <TableHead className="text-muted-foreground text-right">INP</TableHead>
          <TableHead className="text-muted-foreground text-right">FCP</TableHead>
          <TableHead className="text-muted-foreground text-right">TTFB</TableHead>
          <TableHead className="text-muted-foreground text-center">Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page) => {
          const ratingStyle = RATING_BADGE_STYLES[page.worstRating]

          return (
            <TableRow
              key={page.url}
              className="border-border hover:bg-accent/30"
            >
              <TableCell className="text-sm text-foreground max-w-xs truncate">
                {page.url}
              </TableCell>
              {(['lcp', 'cls', 'inp', 'fcp', 'ttfb'] as const).map((key) => {
                const metric = key.toUpperCase()
                const formatted = formatMetricValue(
                  page[key],
                  metric,
                  thresholds
                )
                return (
                  <TableCell
                    key={key}
                    className={cn(
                      'text-right text-sm font-mono',
                      formatted
                        ? VALUE_COLORS[formatted.rating]
                        : 'text-muted-foreground'
                    )}
                  >
                    {formatted?.display ?? '-'}
                  </TableCell>
                )
              })}
              <TableCell className="text-center">
                <Badge
                  className={cn('text-[10px] border', ratingStyle)}
                >
                  {RATING_LABELS[page.worstRating]}
                </Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
