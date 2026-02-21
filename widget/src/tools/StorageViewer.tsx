import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { captureStorage, type StorageSnapshot } from '../interceptors/storage'
import { COLORS } from '../toolbar/styles'

export function StorageViewer() {
  const [data, setData] = useState<StorageSnapshot>({ localStorage: {}, sessionStorage: {}, cookies: '' })
  const [tab, setTab] = useState<'ls' | 'ss' | 'cookies'>('ls')

  useEffect(() => { setData(captureStorage()) }, [])

  const tabBtn = (id: 'ls' | 'ss' | 'cookies', tabLabel: string) => h('button', {
    style: {
      padding: '4px 10px',
      fontSize: 11,
      cursor: 'pointer',
      border: 'none',
      fontFamily: 'inherit',
      background: tab === id ? COLORS.toolBtnBgActive : 'transparent',
      color: tab === id ? '#fff' : COLORS.textMuted,
      borderRadius: 4,
    },
    onClick: () => setTab(id),
  }, tabLabel)

  const source = tab === 'ls' ? data.localStorage : tab === 'ss' ? data.sessionStorage : null
  const entries = source ? Object.entries(source) : []

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h('div', {
      style: {
        display: 'flex',
        gap: 4,
        padding: '6px 8px',
        borderBottom: `1px solid ${COLORS.panelBorder}`,
      },
    },
      tabBtn('ls', 'localStorage'),
      tabBtn('ss', 'sessionStorage'),
      tabBtn('cookies', 'Cookies'),
    ),
    h('div', { style: { flex: 1, overflowY: 'auto' } },
      tab === 'cookies'
        ? h('pre', {
            style: {
              padding: 12,
              fontSize: 10,
              color: COLORS.text,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
            },
          }, data.cookies || '(empty)')
        : entries.length === 0
          ? h('p', { style: { padding: 12, fontSize: 11, color: COLORS.textMuted } }, '(empty)')
          : entries.map(([k, v]) =>
            h('div', {
              key: k,
              style: {
                display: 'flex',
                gap: 8,
                padding: '4px 12px',
                borderBottom: `1px solid ${COLORS.panelBorder}`,
                fontSize: 11,
              },
            },
              h('span', {
                style: {
                  color: COLORS.textMuted,
                  flexShrink: 0,
                  width: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              }, k),
              h('span', {
                style: {
                  color: COLORS.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                },
              }, v)
            )
          )
    )
  )
}
