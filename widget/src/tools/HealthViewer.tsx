import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { getHealthIssues, subscribeHealth, type HealthIssue } from '../interceptors/health'
import { COLORS } from '../toolbar/styles'

export function HealthViewer() {
  const [issues, setIssues] = useState<HealthIssue[]>([])

  useEffect(() => {
    setIssues(getHealthIssues())
    return subscribeHealth(() => setIssues(getHealthIssues()))
  }, [])

  return h('div', { style: { flex: 1, overflowY: 'auto' } },
    issues.length === 0
      ? h('p', { style: { padding: 16, fontSize: 12, color: COLORS.textMuted } }, 'No health issues detected.')
      : issues.map((issue) =>
        h('div', {
          key: `${issue.category}:${issue.message}`,
          style: {
            padding: '8px 12px',
            borderBottom: `1px solid ${COLORS.panelBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          },
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
            h('span', { style: { fontSize: 11, color: COLORS.text } }, issue.message)
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
}
