import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import {
  getConsoleEntries,
  clearConsoleEntries,
  subscribeConsole,
} from '../interceptors/console'
import type { ConsoleEntry, ConsoleLevel } from '../interceptors/console'
import { COLORS } from '../toolbar/styles'
import { formatConsoleRow, formatConsoleTab } from '../lib/copy'

const LEVEL_COLORS: Record<ConsoleLevel, string> = {
  log: '#94a3b8',
  info: '#3b82f6',
  warn: '#eab308',
  error: '#ef4444',
}

const LEVEL_BG: Record<ConsoleLevel, string> = {
  log: 'rgba(148, 163, 184, 0.15)',
  info: 'rgba(59, 130, 246, 0.15)',
  warn: 'rgba(234, 179, 8, 0.15)',
  error: 'rgba(239, 68, 68, 0.15)',
}

const ALL_LEVELS: readonly ConsoleLevel[] = ['log', 'info', 'warn', 'error']

function formatTime(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${m}:${s}.${ms}`
}

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

const filterGroupStyle: Record<string, string> = {
  display: 'flex',
  gap: '4px',
  flexWrap: 'wrap',
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
  backgroundColor: 'none',
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
}

const timestampStyle: Record<string, string> = {
  fontSize: '10px',
  color: COLORS.textMuted,
  flexShrink: '0',
}

const argsStyle: Record<string, string> = {
  color: COLORS.text,
  whiteSpace: 'pre-wrap',
  lineHeight: '1.4',
}

const emptyStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: COLORS.textMuted,
  fontSize: '12px',
}

function filterBtnStyle(
  active: boolean,
  level: ConsoleLevel
): Record<string, string> {
  return {
    padding: '2px 6px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: active ? LEVEL_COLORS[level] : COLORS.toolBtnBg,
    color: active ? '#fff' : COLORS.textMuted,
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
  }
}

export function ConsoleViewer() {
  const [entries, setEntries] = useState<readonly ConsoleEntry[]>(
    getConsoleEntries
  )
  const [activeFilters, setActiveFilters] = useState<
    ReadonlySet<ConsoleLevel>
  >(new Set(ALL_LEVELS))
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  // Subscribe to buffer changes
  useEffect(() => {
    const unsubscribe = subscribeConsole(() => {
      setEntries(getConsoleEntries())
    })
    return unsubscribe
  }, [])

  const handleClear = useCallback(() => {
    clearConsoleEntries()
    setEntries([])
  }, [])

  const toggleFilter = useCallback((level: ConsoleLevel) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(level)) {
        next.delete(level)
      } else {
        next.add(level)
      }
      return next
    })
  }, [])

  const filtered = entries.filter((e) => activeFilters.has(e.level))

  return h(
    'div',
    { style: containerStyle },
    // Filter bar
    h(
      'div',
      { style: headerBarStyle },
      h(
        'div',
        { style: filterGroupStyle },
        ALL_LEVELS.map((level) =>
          h(
            'button',
            {
              key: level,
              style: filterBtnStyle(activeFilters.has(level), level),
              onClick: () => toggleFilter(level),
              title: `Toggle ${level} entries`,
            },
            level
          )
        )
      ),
      h(
        'button',
        {
          style: copyTabBtnStyle,
          onClick: () =>
            navigator.clipboard
              .writeText(formatConsoleTab(filtered as ConsoleEntry[]))
              .catch(() => {}),
          title: 'Copy all console entries',
        },
        'Copy Console'
      ),
      h(
        'button',
        {
          style: clearBtnStyle,
          onClick: handleClear,
          title: 'Clear console entries',
        },
        'Clear'
      )
    ),
    // Entry list
    filtered.length === 0
      ? h('div', { style: emptyStyle }, 'No console entries')
      : h(
          'div',
          { style: listStyle },
          filtered.map((entry, i) =>
            h(
              'div',
              {
                key: entry.id,
                style: {
                  ...entryStyle,
                  backgroundColor: LEVEL_BG[entry.level],
                },
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
                      backgroundColor: LEVEL_COLORS[entry.level],
                      color: '#fff',
                    },
                  },
                  entry.level
                ),
                h('span', { style: timestampStyle }, formatTime(entry.timestamp)),
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
                    navigator.clipboard.writeText(formatConsoleRow(entry)).catch(() => {})
                  },
                  title: 'Copy row',
                }, '\u29C7')
              ),
              h('div', { style: argsStyle }, entry.args.join(' '))
            )
          )
        )
  )
}
