export type MetricName = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB'

export type Rating = 'good' | 'needs-improvement' | 'poor'

export interface PerfThreshold {
  readonly good: number
  readonly poor: number
  readonly unit: string
}

export interface PerfEntry {
  readonly id: number
  readonly projectId: string
  readonly type: string
  readonly title: string
  readonly content: string | null
  readonly source: string | null
  readonly metadata: string | null
  readonly createdAt: string | null
}

export interface DailyAverage {
  readonly day: string
  readonly label: string
  readonly avg: number
  readonly count: number
}

export interface PageMetrics {
  readonly url: string
  readonly lcp: number | null
  readonly cls: number | null
  readonly inp: number | null
  readonly fcp: number | null
  readonly ttfb: number | null
  readonly worstRating: Rating
}

export const THRESHOLDS: Readonly<Record<string, PerfThreshold>> = {
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  CLS: { good: 0.1, poor: 0.25, unit: '' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
}

export const ALL_METRICS: readonly MetricName[] = [
  'LCP', 'FCP', 'CLS', 'INP', 'TTFB',
]

export function getRating(
  value: number,
  threshold: PerfThreshold
): Rating {
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}
