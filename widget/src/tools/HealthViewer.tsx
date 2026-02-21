import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { getHealthIssues, subscribeHealth, type HealthIssue } from '../interceptors/health'
import { COLORS } from '../toolbar/styles'
import { formatHealthRow, formatHealthTab } from '../lib/copy'

export function HealthViewer() {
  const [issues, setIssues] = useState<HealthIssue[]>([])
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  useEffect(() => {
    setIssues(getHealthIssues())
    return subscribeHealth(() => setIssues(getHealthIssues()))
  }, [])

  return h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } },
    // Header bar with count + copy tab button
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderBottom: `1px solid ${COLORS.panelBorder}`,
        flexShrink: 0,
      },
    },
      h('span', { style: { fontSize: 10, color: COLORS.textMuted } }, `${issues.length} issue${issues.length !== 1 ? 's' : ''}`),
      h('button', {
        style: {
          marginLeft: 'auto',
          background: 'none',
          border: `1px solid ${COLORS.panelBorder}`,
          borderRadius: 4,
          color: COLORS.textMuted,
          cursor: 'pointer',
          fontSize: 10,
          padding: '2px 8px',
          fontFamily: 'inherit',
        },
        onClick: () => navigator.clipboard.writeText(formatHealthTab(issues)).catch(() => {}),
        title: 'Copy all health issues',
      }, 'Copy Health')
    ),
    // Issue list
    h('div', { style: { flex: 1, overflowY: 'auto' } },
      issues.length === 0
        ? h('p', { style: { padding: 16, fontSize: 12, color: COLORS.textMuted } }, 'No health issues detected.')
        : issues.map((issue, i) =>
          h('div', {
            key: `${issue.category}:${issue.message}:${i}`,
            style: {
              padding: '8px 12px',
              borderBottom: `1px solid ${COLORS.panelBorder}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              position: 'relative',
            },
            onMouseEnter: () => setHoveredRow(i),
            onMouseLeave: () => setHoveredRow(null),
          },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
              h('span', {
                style: {
                  fontSize: 10,
                  fontWeight: 600,
                  color: issue.severity === 'error' ? '#ef4444' : '#f59e0b',
                  textTransform: 'uppercase',
                },
              }, issue.severity),
              h('span', { style: { fontSize: 11, color: COLORS.text } }, issue.message),
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
                  navigator.clipboard.writeText(formatHealthRow(issue)).catch(() => {})
                },
                title: 'Copy row',
              }, '\u29C7')
            ),
            issue.detail && h('span', {
              style: {
                fontSize: 10,
                color: COLORS.textMuted,
                fontFamily: 'monospace',
                marginLeft: 12,
              },
            }, issue.detail)
          )
        )
    )
  )
}
