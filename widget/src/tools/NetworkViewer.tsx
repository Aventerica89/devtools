import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import {
  getNetworkEntries,
  clearNetworkEntries,
  subscribeNetwork,
} from '../interceptors/network'
import type { NetworkEntry } from '../interceptors/network'
import { COLORS } from '../toolbar/styles'

// -- Method badge colors --

const METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#eab308',
  DELETE: '#ef4444',
  PATCH: '#a855f7',
}

const DEFAULT_METHOD_COLOR = '#94a3b8'

function getMethodColor(method: string): string {
  return METHOD_COLORS[method] ?? DEFAULT_METHOD_COLOR
}

// -- Status color coding --

function getStatusColor(status: number): string {
  if (status === 0) return '#ef4444' // network error
  if (status < 300) return '#22c55e' // 2xx green
  if (status < 400) return '#3b82f6' // 3xx blue
  if (status < 500) return '#eab308' // 4xx amber
  return '#ef4444' // 5xx red
}

function getStatusBg(status: number): string {
  if (status === 0) return 'rgba(239, 68, 68, 0.15)'
  if (status < 300) return 'rgba(34, 197, 94, 0.15)'
  if (status < 400) return 'rgba(59, 130, 246, 0.15)'
  if (status < 500) return 'rgba(234, 179, 8, 0.15)'
  return 'rgba(239, 68, 68, 0.15)'
}

// -- Formatting helpers --

function formatTime(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function truncateUrl(url: string, maxLen: number): string {
  if (url.length <= maxLen) return url
  return url.slice(0, maxLen - 3) + '...'
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
  gap: '6px',
  flexShrink: '0',
}

const countStyle: Record<string, string> = {
  fontSize: '10px',
  color: COLORS.textMuted,
  flexShrink: '0',
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

const listStyle: Record<string, string> = {
  flex: '1',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '0 4px 4px',
}

const rowStyle: Record<string, string> = {
  display: 'flex',
  flexDirection: 'column',
  padding: '5px 6px',
  borderRadius: '4px',
  marginBottom: '2px',
  fontSize: '11px',
  fontFamily: 'monospace',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
}

const rowHeaderStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: '0',
}

const methodBadgeStyle: Record<string, string> = {
  padding: '1px 5px',
  borderRadius: '3px',
  fontSize: '9px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  flexShrink: '0',
  color: '#fff',
}

const statusBadgeStyle: Record<string, string> = {
  padding: '1px 4px',
  borderRadius: '3px',
  fontSize: '10px',
  fontWeight: '600',
  flexShrink: '0',
}

const urlStyle: Record<string, string> = {
  flex: '1',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: COLORS.text,
  fontSize: '10px',
  minWidth: '0',
}

const durationStyle: Record<string, string> = {
  fontSize: '10px',
  color: COLORS.textMuted,
  flexShrink: '0',
  textAlign: 'right',
  minWidth: '40px',
}

const timestampStyle: Record<string, string> = {
  fontSize: '10px',
  color: COLORS.textMuted,
  flexShrink: '0',
}

const detailsStyle: Record<string, string> = {
  marginTop: '6px',
  padding: '6px 8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
  fontSize: '10px',
  fontFamily: 'monospace',
  lineHeight: '1.5',
  wordBreak: 'break-all',
}

const detailLabelStyle: Record<string, string> = {
  fontWeight: '600',
  color: COLORS.textBright,
  marginBottom: '2px',
  marginTop: '6px',
  display: 'block',
}

const detailValueStyle: Record<string, string> = {
  color: COLORS.textMuted,
}

const headerRowStyle: Record<string, string> = {
  display: 'flex',
  gap: '4px',
  color: COLORS.textMuted,
  padding: '1px 0',
}

const headerKeyStyle: Record<string, string> = {
  color: '#93c5fd',
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

// -- Detail panel for an expanded entry --

function EntryDetails({ entry }: { readonly entry: NetworkEntry }) {
  const reqHeaders = Object.entries(entry.requestHeaders)
  const resHeaders = Object.entries(entry.responseHeaders)

  return h(
    'div',
    { style: detailsStyle },
    // General info
    h('span', { style: { ...detailLabelStyle, marginTop: '0' } }, 'General'),
    h(
      'div',
      { style: detailValueStyle },
      h('div', null, `URL: ${entry.url}`),
      h('div', null, `Method: ${entry.method}`),
      h(
        'div',
        null,
        `Status: ${entry.status} ${entry.statusText}`
      ),
      h('div', null, `Duration: ${formatDuration(entry.duration)}`),
      h('div', null, `Request size: ${formatSize(entry.requestSize)}`),
      h('div', null, `Response size: ${formatSize(entry.responseSize)}`),
      h('div', null, `Time: ${formatTime(entry.timestamp)}`)
    ),
    // Request headers
    reqHeaders.length > 0
      ? h(
          'div',
          null,
          h('span', { style: detailLabelStyle }, 'Request Headers'),
          reqHeaders.map(([key, value]) =>
            h(
              'div',
              { key, style: headerRowStyle },
              h('span', { style: headerKeyStyle }, `${key}:`),
              h('span', null, value)
            )
          )
        )
      : null,
    // Response headers
    resHeaders.length > 0
      ? h(
          'div',
          null,
          h('span', { style: detailLabelStyle }, 'Response Headers'),
          resHeaders.map(([key, value]) =>
            h(
              'div',
              { key, style: headerRowStyle },
              h('span', { style: headerKeyStyle }, `${key}:`),
              h('span', null, value)
            )
          )
        )
      : null
  )
}

// -- Main component --

export function NetworkViewer() {
  const [entries, setEntries] = useState<readonly NetworkEntry[]>(
    getNetworkEntries
  )
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeNetwork(() => {
      setEntries(getNetworkEntries())
    })
    return unsubscribe
  }, [])

  const handleClear = useCallback(() => {
    clearNetworkEntries()
    setEntries([])
    setExpandedId(null)
  }, [])

  const toggleExpand = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  return h(
    'div',
    { style: containerStyle },
    // Header bar
    h(
      'div',
      { style: headerBarStyle },
      h(
        'span',
        { style: countStyle },
        `${entries.length} request${entries.length !== 1 ? 's' : ''}`
      ),
      h(
        'button',
        {
          style: clearBtnStyle,
          onClick: handleClear,
          title: 'Clear network entries',
        },
        'Clear'
      )
    ),
    // Entry list
    entries.length === 0
      ? h('div', { style: emptyStyle }, 'No network requests')
      : h(
          'div',
          { style: listStyle },
          entries.map((entry) => {
            const isExpanded = expandedId === entry.id
            return h(
              'div',
              {
                key: entry.id,
                style: {
                  ...rowStyle,
                  backgroundColor: isExpanded
                    ? 'rgba(59, 130, 246, 0.12)'
                    : getStatusBg(entry.status),
                },
                onClick: () => toggleExpand(entry.id),
              },
              // Row header: method | status | url | duration | time
              h(
                'div',
                { style: rowHeaderStyle },
                // Method badge
                h(
                  'span',
                  {
                    style: {
                      ...methodBadgeStyle,
                      backgroundColor: getMethodColor(entry.method),
                    },
                  },
                  entry.method
                ),
                // Status badge
                h(
                  'span',
                  {
                    style: {
                      ...statusBadgeStyle,
                      color: getStatusColor(entry.status),
                      backgroundColor: getStatusBg(entry.status),
                    },
                  },
                  entry.status === 0 ? 'ERR' : String(entry.status)
                ),
                // URL
                h(
                  'span',
                  { style: urlStyle, title: entry.url },
                  truncateUrl(entry.url, 40)
                ),
                // Duration
                h(
                  'span',
                  { style: durationStyle },
                  formatDuration(entry.duration)
                ),
                // Timestamp
                h(
                  'span',
                  { style: timestampStyle },
                  formatTime(entry.timestamp)
                )
              ),
              // Expanded details
              isExpanded ? h(EntryDetails, { entry }) : null
            )
          })
        )
  )
}
