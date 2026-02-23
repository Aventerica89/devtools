import { h } from 'preact'
import { useState, useEffect, useRef } from 'preact/hooks'
import { COLORS } from '../toolbar/styles'

interface KbEntry { id: string; title: string; type: string; snippet?: string; description?: string }
const FILTERS = ['All', 'Standards', 'Git', 'API', 'Deploy'] as const

interface Props { apiBase: string; pinHash: string; onClose: () => void }

export function CommandPalette({ apiBase, pinHash, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [entries, setEntries] = useState<KbEntry[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${apiBase}/api/hub/kb`, { headers: { 'X-DevTools-Pin': pinHash } })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then((d) => { if (Array.isArray(d)) setEntries(d) })
      .catch(() => {})
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [apiBase, pinHash])

  function copy(entry: KbEntry) {
    navigator.clipboard.writeText(entry.snippet ?? entry.title).then(() => {
      setCopied(entry.id)
      setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }

  const filtered = entries.filter((e) => {
    const matchFilter = filter === 'All' || e.type === filter
    const matchQuery = !query ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      (e.snippet ?? '').toLowerCase().includes(query.toLowerCase())
    return matchFilter && matchQuery
  })

  return h('div', {
    style: { position: 'fixed', inset: 0, zIndex: 2147483647, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 96 },
    onClick: onClose,
  },
    h('div', {
      style: { width: '100%', maxWidth: 600, background: COLORS.panelBg, border: `1px solid ${COLORS.panelBorder}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', fontFamily: 'system-ui,sans-serif' },
      onClick: (e: MouseEvent) => e.stopPropagation(),
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
        h('input', { ref: inputRef, value: query,
          style: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: COLORS.text, fontSize: 13, fontFamily: 'inherit' },
          placeholder: 'Search knowledge base...',
          onInput: (e: Event) => setQuery((e.target as HTMLInputElement).value) }),
        h('button', { style: { background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 16 }, onClick: onClose }, '\u2715')
      ),
      h('div', { style: { display: 'flex', gap: 4, padding: '6px 10px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
        FILTERS.map((f) =>
          h('button', { key: f,
            style: { padding: '2px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
              background: filter === f ? COLORS.toolBtnBgActive : COLORS.toolBtnBg,
              color: filter === f ? '#fff' : COLORS.textMuted },
            onClick: () => setFilter(f) }, f)
        )
      ),
      h('div', { style: { maxHeight: 360, overflowY: 'auto' } },
        filtered.length === 0
          ? h('p', { style: { padding: '24px 14px', textAlign: 'center', color: COLORS.textMuted, fontSize: 12 } }, 'No results')
          : filtered.map((entry) =>
            h('div', { key: entry.id, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 14px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 } },
                h('span', { style: { fontSize: 12, color: COLORS.text, fontWeight: 500 } }, entry.title),
                entry.description && h('span', { style: { fontSize: 10, color: COLORS.textMuted } }, entry.description),
                entry.snippet && window.innerWidth >= 768 && h('code', { style: { fontSize: 10, background: '#0a0f1a', color: '#94a3b8', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, entry.snippet)
              ),
              entry.snippet && window.innerWidth >= 768 && h('button', {
                style: { background: 'none', border: 'none', cursor: 'pointer', color: copied === entry.id ? '#34d399' : COLORS.textMuted, fontSize: 14, marginLeft: 8, flexShrink: 0 },
                onClick: () => copy(entry) }, '\u29c9')
            )
          )
      )
    )
  )
}
