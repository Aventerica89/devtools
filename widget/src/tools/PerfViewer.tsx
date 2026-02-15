import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import {
  getPerfEntries,
  clearPerfEntries,
  subscribePerfEntries,
} from '../interceptors/performance'
import type { PerfEntry, MetricName, Rating } from '../interceptors/performance'
import { COLORS } from '../toolbar/styles'

/**
 * Rating color map for Web Vitals badges.
 */
const RATING_COLORS: Readonly<Record<Rating, string>> = {
  good: '#22c55e',
  'needs-improvement': '#eab308',
  poor: '#ef4444',
}

const RATING_BG: Readonly<Record<Rating, string>> = {
  good: 'rgba(34, 197, 94, 0.15)',
  'needs-improvement': 'rgba(234, 179, 8, 0.15)',
  poor: 'rgba(239, 68, 68, 0.15)',
}

const METRIC_LABELS: Readonly<Record<MetricName, string>> = {
  LCP: 'Largest Contentful Paint',
  CLS: 'Cumulative Layout Shift',
  INP: 'Interaction to Next Paint',
  FCP: 'First Contentful Paint',
  TTFB: 'Time to First Byte',
}

const METRIC_UNITS: Readonly<Record<MetricName, string>> = {
  LCP: 'ms',
  CLS: '',
  INP: 'ms',
  FCP: 'ms',
  TTFB: 'ms',
}

const ALL_METRICS: readonly MetricName[] = ['LCP', 'FCP', 'CLS', 'INP', 'TTFB']

function formatTime(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

/**
 * Get the latest entry per metric from a list of entries.
 */
function getLatestPerMetric(
  entries: readonly PerfEntry[]
): Readonly<Record<string, PerfEntry>> {
  const latest: Record<string, PerfEntry> = {}
  for (const entry of entries) {
    const existing = latest[entry.metric]
    if (!existing || entry.id > existing.id) {
      latest[entry.metric] = entry
    }
  }
  return latest
}

// -- Styles --

const containerStyle: Record<string, string> = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
}

const headerBarStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 8px',
  flexShrink: '0',
}

const headerTitleStyle: Record<string, string> = {
  fontSize: '11px',
  fontWeight: '600',
  color: COLORS.textBright,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const clearBtnStyle: Record<string, string> = {
  padding: '3px 8px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: COLORS.toolBtnBg,
  color: COLORS.textMuted,
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: '500',
  flexShrink: '0',
}

const scoreGridStyle: Record<string, string> = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '6px',
  padding: '4px 8px 8px',
  flexShrink: '0',
}

const scoreCardStyle: Record<string, string> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  padding: '8px 6px',
  borderRadius: '6px',
  backgroundColor: COLORS.toolBtnBg,
}

const scoreValueStyle: Record<string, string> = {
  fontSize: '16px',
  fontWeight: '700',
  fontFamily: 'monospace',
}

const scoreLabelStyle: Record<string, string> = {
  fontSize: '9px',
  fontWeight: '500',
  color: COLORS.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
}

const dividerStyle: Record<string, string> = {
  height: '1px',
  backgroundColor: COLORS.panelBorder,
  margin: '0 8px',
  flexShrink: '0',
}

const logHeaderStyle: Record<string, string> = {
  fontSize: '10px',
  fontWeight: '600',
  color: COLORS.textMuted,
  padding: '6px 8px 2px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  flexShrink: '0',
}

const listStyle: Record<string, string> = {
  flex: '1',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '0 4px 4px',
}

const entryStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 6px',
  borderRadius: '4px',
  marginBottom: '2px',
  fontSize: '11px',
  fontFamily: 'monospace',
}

const badgeStyle: Record<string, string> = {
  padding: '1px 5px',
  borderRadius: '3px',
  fontSize: '10px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  flexShrink: '0',
  color: '#fff',
}

const metricNameStyle: Record<string, string> = {
  fontWeight: '600',
  color: COLORS.text,
  flexShrink: '0',
  minWidth: '32px',
}

const valueStyle: Record<string, string> = {
  color: COLORS.textBright,
  flex: '1',
}

const timestampStyle: Record<string, string> = {
  fontSize: '10px',
  color: COLORS.textMuted,
  flexShrink: '0',
}

const emptyStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: COLORS.textMuted,
  fontSize: '12px',
}

function ratingLabel(rating: Rating): string {
  if (rating === 'good') return 'Good'
  if (rating === 'needs-improvement') return 'OK'
  return 'Poor'
}

export function PerfViewer() {
  const [entries, setEntries] = useState<readonly PerfEntry[]>(getPerfEntries)

  useEffect(() => {
    const unsubscribe = subscribePerfEntries(() => {
      setEntries(getPerfEntries())
    })
    return unsubscribe
  }, [])

  const handleClear = useCallback(() => {
    clearPerfEntries()
    setEntries([])
  }, [])

  const latestMap = getLatestPerMetric(entries)

  // Score cards for the latest value of each metric
  const scoreCards = ALL_METRICS
    .map((m) => {
      const entry = latestMap[m]
      if (!entry) return null
      const unit = METRIC_UNITS[m]
      const displayValue = m === 'CLS'
        ? entry.value.toFixed(3)
        : `${Math.round(entry.value)}`
      return { metric: m, entry, displayValue, unit }
    })
    .filter(Boolean) as ReadonlyArray<{
      metric: MetricName
      entry: PerfEntry
      displayValue: string
      unit: string
    }>

  return h(
    'div',
    { style: containerStyle },
    // Header bar
    h(
      'div',
      { style: headerBarStyle },
      h('span', { style: headerTitleStyle }, 'Web Vitals'),
      h(
        'button',
        {
          style: clearBtnStyle,
          onClick: handleClear,
          title: 'Clear performance entries',
        },
        'Clear'
      )
    ),
    // Score grid (latest per metric)
    scoreCards.length > 0
      ? h(
          'div',
          { style: scoreGridStyle },
          scoreCards.map((card) =>
            h(
              'div',
              {
                key: card.metric,
                style: {
                  ...scoreCardStyle,
                  borderLeft: `3px solid ${RATING_COLORS[card.entry.rating]}`,
                },
                title: METRIC_LABELS[card.metric],
              },
              h(
                'span',
                {
                  style: {
                    ...scoreValueStyle,
                    color: RATING_COLORS[card.entry.rating],
                  },
                },
                `${card.displayValue}${card.unit}`
              ),
              h('span', { style: scoreLabelStyle }, card.metric)
            )
          )
        )
      : null,
    // Divider
    entries.length > 0 ? h('div', { style: dividerStyle }) : null,
    // Log section header
    entries.length > 0
      ? h('div', { style: logHeaderStyle }, 'Event Log')
      : null,
    // Entry list (all entries, newest first)
    entries.length === 0
      ? h('div', { style: emptyStyle }, 'Waiting for Web Vitals data...')
      : h(
          'div',
          { style: listStyle },
          [...entries].reverse().map((entry) => {
            const unit = METRIC_UNITS[entry.metric]
            const displayValue = entry.metric === 'CLS'
              ? entry.value.toFixed(3)
              : `${Math.round(entry.value)}`
            return h(
              'div',
              {
                key: entry.id,
                style: {
                  ...entryStyle,
                  backgroundColor: RATING_BG[entry.rating],
                },
              },
              h(
                'span',
                {
                  style: {
                    ...badgeStyle,
                    backgroundColor: RATING_COLORS[entry.rating],
                  },
                },
                ratingLabel(entry.rating)
              ),
              h('span', { style: metricNameStyle }, entry.metric),
              h(
                'span',
                { style: valueStyle },
                `${displayValue}${unit}`
              ),
              h(
                'span',
                { style: timestampStyle },
                formatTime(entry.timestamp)
              )
            )
          })
        )
  )
}
