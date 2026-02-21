/**
 * ErrorListViewer -- in-panel error log that displays captured errors
 * inside the ToolPanel when the 'errors' tool is active.
 */
import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import {
  getErrorEntries,
  clearErrorEntries,
  subscribeErrors,
} from '../interceptors/errors'
import type { ErrorEntry } from '../interceptors/errors'
import { COLORS } from '../toolbar/styles'
import { formatErrorRow, formatErrorsTab } from '../lib/copy'

const ERROR_COLOR = '#ef4444'
const ERROR_BG = 'rgba(239, 68, 68, 0.15)'
const REJECTION_COLOR = '#f97316'
const REJECTION_BG = 'rgba(249, 115, 22, 0.15)'

// -- Inline styles --

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

const copyTabBtnStyle: Record<string, string> = {
  padding: '2px 8px',
  borderRadius: '4px',
  border: `1px solid ${COLORS.panelBorder}`,
  backgroundColor: 'transparent',
  color: COLORS.textMuted,
  cursor: 'pointer',
  fontSize: '10px',
  fontFamily: 'inherit',
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
  flexDirection: 'column',
  gap: '2px',
  padding: '4px 6px',
  borderRadius: '4px',
  marginBottom: '2px',
  fontSize: '11px',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  cursor: 'pointer',
  position: 'relative',
}

const entryHeaderStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const badgeStyle: Record<string, string> = {
  padding: '1px 5px',
  borderRadius: '3px',
  fontSize: '10px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  flexShrink: '0',
  color: '#fff',
}

const timestampStyle: Record<string, string> = {
  fontSize: '10px',
  color: COLORS.textMuted,
  flexShrink: '0',
}

const stackFrameStyle: Record<string, string> = {
  padding: '1px 0',
  wordBreak: 'break-all',
}

const stackFrameDimStyle: Record<string, string> = {
  ...stackFrameStyle,
  opacity: '0.5',
}

const reportBtnStyle: Record<string, string> = {
  padding: '3px 8px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: '500',
  backgroundColor: '#dc2626',
  color: '#fff',
}

const emptyStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: COLORS.textMuted,
  fontSize: '12px',
}

// -- Helpers --

function formatTime(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

function getTypeColor(type: ErrorEntry['type']): string {
  return type === 'error' ? ERROR_COLOR : REJECTION_COLOR
}

function getTypeBg(type: ErrorEntry['type']): string {
  return type === 'error' ? ERROR_BG : REJECTION_BG
}

function parseStack(stack: string): readonly string[] {
  if (!stack) return []
  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function isNodeModulesFrame(frame: string): boolean {
  return frame.includes('node_modules')
}

// -- Component --

interface ErrorListProps {
  readonly onReportBug?: (entry: ErrorEntry) => void
}

export function ErrorListViewer({ onReportBug }: ErrorListProps) {
  const [entries, setEntries] = useState<readonly ErrorEntry[]>(
    getErrorEntries
  )
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeErrors(() => {
      setEntries(getErrorEntries())
    })
    return unsubscribe
  }, [])

  const handleClear = useCallback(() => {
    clearErrorEntries()
    setEntries([])
    setExpandedId(null)
  }, [])

  const toggleExpand = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  return h(
    'div',
    { style: containerStyle },
    h(
      'div',
      { style: headerBarStyle },
      h(
        'span',
        { style: countStyle },
        `${entries.length} error${entries.length !== 1 ? 's' : ''}`
      ),
      h(
        'button',
        {
          style: copyTabBtnStyle,
          onClick: () =>
            navigator.clipboard
              .writeText(formatErrorsTab(entries as ErrorEntry[]))
              .catch(() => {}),
          title: 'Copy all error entries',
        },
        'Copy Errors'
      ),
      h(
        'button',
        {
          style: clearBtnStyle,
          onClick: handleClear,
          title: 'Clear error entries',
        },
        'Clear'
      )
    ),
    entries.length === 0
      ? h('div', { style: emptyStyle }, 'No errors captured')
      : h(
          'div',
          { style: listStyle },
          entries.map((entry, i) => {
            const isExpanded = expandedId === entry.id
            const frames = parseStack(entry.stack)

            return h(
              'div',
              {
                key: entry.id,
                style: {
                  ...entryStyle,
                  backgroundColor: isExpanded
                    ? 'rgba(239, 68, 68, 0.12)'
                    : getTypeBg(entry.type),
                },
                onClick: () => toggleExpand(entry.id),
                onMouseEnter: () => setHoveredRow(i),
                onMouseLeave: () => setHoveredRow(null),
              },
              h(
                'div',
                { style: entryHeaderStyle },
                h(
                  'span',
                  {
                    style: {
                      ...badgeStyle,
                      backgroundColor: getTypeColor(entry.type),
                    },
                  },
                  entry.type === 'error' ? 'ERR' : 'REJ'
                ),
                h(
                  'span',
                  {
                    style: {
                      flex: '1',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: COLORS.text,
                      fontSize: '10px',
                    },
                  },
                  entry.message
                ),
                h(
                  'span',
                  { style: timestampStyle },
                  formatTime(entry.timestamp)
                ),
                h('button', {
                  style: {
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                    flexShrink: 0,
                    color: COLORS.textMuted,
                    fontSize: 12,
                    opacity: hoveredRow === i ? 1 : 0,
                    transition: 'opacity .1s',
                    padding: '0 4px',
                  },
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(formatErrorRow(entry)).catch(() => {})
                  },
                  title: 'Copy row',
                }, '\u29C7')
              ),
              isExpanded
                ? h(
                    'div',
                    {
                      style: {
                        marginTop: '6px',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        lineHeight: '1.5',
                      },
                    },
                    entry.source
                      ? h(
                          'div',
                          {
                            style: {
                              color: '#93c5fd',
                              marginBottom: '4px',
                            },
                          },
                          `${entry.source}:${entry.line}:${entry.col}`
                        )
                      : null,
                    frames.length > 0
                      ? frames.map((frame, fi) =>
                          h(
                            'div',
                            {
                              key: fi,
                              style: isNodeModulesFrame(frame)
                                ? stackFrameDimStyle
                                : stackFrameStyle,
                            },
                            frame
                          )
                        )
                      : h(
                          'span',
                          { style: { color: COLORS.textMuted } },
                          'No stack trace available'
                        ),
                    onReportBug
                      ? h(
                          'button',
                          {
                            style: {
                              ...reportBtnStyle,
                              marginTop: '8px',
                              width: '100%',
                            },
                            onClick: (e: Event) => {
                              e.stopPropagation()
                              onReportBug(entry)
                            },
                          },
                          'Report Bug'
                        )
                      : null
                  )
                : null
            )
          })
        )
  )
}
