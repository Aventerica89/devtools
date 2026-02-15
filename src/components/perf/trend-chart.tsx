'use client'

import { cn } from '@/lib/utils'
import type { MetricName, PerfEntry, DailyAverage, PerfThreshold } from './types'
import { getRating } from './types'

interface TrendChartProps {
  readonly metric: MetricName
  readonly entries: readonly PerfEntry[]
  readonly threshold: PerfThreshold
  readonly days: number
}

const RATING_FILLS: Readonly<Record<string, string>> = {
  good: '#22c55e',
  'needs-improvement': '#eab308',
  poor: '#ef4444',
}

function getDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function getDayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function computeDailyAverages(
  entries: readonly PerfEntry[],
  metric: MetricName,
  days: number
): readonly DailyAverage[] {
  const now = new Date()
  const dayMap = new Map<string, { sum: number; count: number; label: string }>()

  // Initialize all days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = getDayKey(d)
    dayMap.set(key, { sum: 0, count: 0, label: getDayLabel(d) })
  }

  // Accumulate values
  const filtered = entries.filter((e) => e.title === metric)
  for (const entry of filtered) {
    if (!entry.createdAt || !entry.content) continue
    const key = entry.createdAt.slice(0, 10)
    const bucket = dayMap.get(key)
    if (bucket) {
      const val = parseFloat(entry.content)
      if (!isNaN(val)) {
        bucket.sum += val
        bucket.count += 1
      }
    }
  }

  return Array.from(dayMap.entries()).map(([day, bucket]) => ({
    day,
    label: bucket.label,
    avg: bucket.count > 0 ? bucket.sum / bucket.count : 0,
    count: bucket.count,
  }))
}

const CHART_WIDTH = 280
const CHART_HEIGHT = 100
const BAR_GAP = 4
const LABEL_HEIGHT = 16

export function TrendChart({
  metric,
  entries,
  threshold,
  days,
}: TrendChartProps) {
  const dailyAverages = computeDailyAverages(entries, metric, days)
  const hasData = dailyAverages.some((d) => d.count > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        No {metric} data in this period
      </div>
    )
  }

  const maxValue = Math.max(
    ...dailyAverages.map((d) => d.avg),
    threshold.good * 1.2
  )
  const barCount = dailyAverages.length
  const barWidth = (CHART_WIDTH - (barCount - 1) * BAR_GAP) / barCount
  const chartArea = CHART_HEIGHT - LABEL_HEIGHT

  // Threshold lines
  const goodY = chartArea - (threshold.good / maxValue) * chartArea
  const poorY = chartArea - (threshold.poor / maxValue) * chartArea

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Threshold lines */}
      <line
        x1={0}
        y1={goodY}
        x2={CHART_WIDTH}
        y2={goodY}
        stroke="#22c55e"
        strokeWidth={0.5}
        strokeDasharray="3,3"
        opacity={0.4}
      />
      <line
        x1={0}
        y1={poorY}
        x2={CHART_WIDTH}
        y2={poorY}
        stroke="#ef4444"
        strokeWidth={0.5}
        strokeDasharray="3,3"
        opacity={0.4}
      />

      {/* Bars */}
      {dailyAverages.map((day, i) => {
        const x = i * (barWidth + BAR_GAP)
        const barHeight = day.avg > 0
          ? Math.max((day.avg / maxValue) * chartArea, 2)
          : 0
        const y = chartArea - barHeight
        const rating = getRating(day.avg, threshold)
        const fill = day.count > 0 ? RATING_FILLS[rating] : '#334155'

        return (
          <g key={day.day}>
            {/* Bar */}
            <rect
              x={x}
              y={day.count > 0 ? y : chartArea - 2}
              width={barWidth}
              height={day.count > 0 ? barHeight : 2}
              rx={2}
              fill={fill}
              opacity={day.count > 0 ? 0.8 : 0.2}
            />
            {/* Value label (on hover area) */}
            {day.count > 0 && (
              <title>
                {day.label}: {metric === 'CLS'
                  ? day.avg.toFixed(3)
                  : Math.round(day.avg)
                }{threshold.unit} ({day.count} sample{day.count !== 1 ? 's' : ''})
              </title>
            )}
            {/* Day label */}
            <text
              x={x + barWidth / 2}
              y={CHART_HEIGHT - 2}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={8}
            >
              {day.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

interface TrendChartsGridProps {
  readonly entries: readonly PerfEntry[]
  readonly thresholds: Readonly<Record<string, PerfThreshold>>
  readonly days: number
}

export function TrendChartsGrid({
  entries,
  thresholds,
  days,
}: TrendChartsGridProps) {
  const metrics: readonly MetricName[] = ['LCP', 'FCP', 'CLS', 'INP', 'TTFB']

  return (
    <div className="grid grid-cols-5 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric}
          className={cn(
            'rounded-lg border border-border bg-card/50',
            'p-3 space-y-2'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {metric}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {days}d trend
            </span>
          </div>
          <div className="h-24">
            <TrendChart
              metric={metric}
              entries={entries}
              threshold={thresholds[metric]}
              days={days}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
