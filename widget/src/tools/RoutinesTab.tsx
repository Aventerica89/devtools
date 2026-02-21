import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { COLORS } from '../toolbar/styles'

interface Checklist { id: number; name: string }
interface RunItem { id: number; itemId: number; checked: number }
interface ItemDef { id: number; name: string; snippet?: string | null }
interface Run { id: number; checklistId: number; startedAt: string; items?: RunItem[] }
interface Props { apiBase: string; pinHash: string; projectId: string }

export function RoutinesTab({ apiBase, pinHash, projectId }: Props) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [activeRun, setActiveRun] = useState<Run | null>(null)
  const [itemDefs, setItemDefs] = useState<ItemDef[]>([])
  const h_ = { 'X-DevTools-Pin': pinHash, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch(`${apiBase}/api/routines?projectId=${projectId}`, { headers: h_ })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(setChecklists)
      .catch(() => {})
  }, [projectId])

  async function startRun(checklistId: number) {
    const res = await fetch(`${apiBase}/api/routines/${checklistId}/runs`, { method: 'POST', headers: h_ })
    if (!res.ok) return
    const run: Run = await res.json()
    const [full, defs] = await Promise.all([
      fetch(`${apiBase}/api/routines/runs/${run.id}`, { headers: h_ }).then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json() }),
      fetch(`${apiBase}/api/routines/${checklistId}/items`, { headers: h_ }).then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json() }),
    ])
    setActiveRun(full)
    setItemDefs(defs)
  }

  async function checkItem(itemId: number, checked: boolean) {
    if (!activeRun) return
    await fetch(`${apiBase}/api/routines/runs/${activeRun.id}/items?itemId=${itemId}`, {
      method: 'PUT', headers: h_, body: JSON.stringify({ checked }),
    }).catch(() => {})
    setActiveRun((prev) => prev ? {
      ...prev,
      items: prev.items?.map((i) => i.itemId === itemId ? { ...i, checked: checked ? 1 : 0 } : i),
    } : null)
  }

  const total = activeRun?.items?.length ?? 0
  const checkedCount = activeRun?.items?.filter((i) => i.checked).length ?? 0
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0

  if (activeRun) {
    return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
      h('div', { style: { padding: '8px 12px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
        h('div', { style: { height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' } },
          h('div', { style: { height: '100%', background: '#6366f1', borderRadius: 2, width: `${pct}%`, transition: 'width .2s' } })
        ),
        h('span', { style: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, display: 'block' } }, `${checkedCount} / ${total} complete`)
      ),
      h('div', { style: { flex: 1, overflowY: 'auto', padding: '4px 0' } },
        (activeRun.items ?? []).map((runItem) => {
          const def = itemDefs.find((d) => d.id === runItem.itemId)
          return h('div', { key: runItem.id, style: { padding: '8px 12px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              h('input', { type: 'checkbox', checked: runItem.checked === 1,
                onChange: (e: Event) => checkItem(runItem.itemId, (e.target as HTMLInputElement).checked) }),
              h('span', { style: { fontSize: 11, color: runItem.checked ? COLORS.textMuted : COLORS.text, textDecoration: runItem.checked ? 'line-through' : 'none' } }, def?.name ?? `Item ${runItem.itemId}`)
            ),
            def?.snippet && h('div', { style: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 22 } },
              h('code', { style: { fontSize: 10, color: '#94a3b8', background: '#0a0f1a', padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, def.snippet),
              h('button', {
                style: { background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 12 },
                onClick: () => navigator.clipboard.writeText(def.snippet ?? '').catch(() => {}),
              }, '\u29C7')
            )
          )
        })
      ),
      h('button', {
        style: { margin: 8, padding: '6px 0', border: `1px solid ${COLORS.panelBorder}`, borderRadius: 6, background: 'none', color: COLORS.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
        onClick: () => setActiveRun(null),
      }, 'Close Run')
    )
  }

  return h('div', { style: { padding: 12, display: 'flex', flexDirection: 'column', gap: 8 } },
    h('p', { style: { fontSize: 11, color: COLORS.textMuted } }, 'Start a checklist run:'),
    ...checklists.map((c) =>
      h('button', {
        key: c.id,
        style: { padding: '7px 12px', borderRadius: 6, background: COLORS.toolBtnBg, border: `1px solid ${COLORS.panelBorder}`, color: COLORS.text, fontSize: 11, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
        onClick: () => startRun(c.id),
      }, '\u25B6 ' + c.name)
    ),
    checklists.length === 0 && h('p', { style: { fontSize: 10, color: COLORS.textMuted } }, 'No checklists. Create one in Dashboard \u2192 Routines.')
  )
}
