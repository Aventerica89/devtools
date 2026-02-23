import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { COLORS, copyClaudeBtnStyle } from '../toolbar/styles'
import type { ApiClient } from '../api/client'

type IdeaStatus = 'idea' | 'in-progress' | 'done'

interface Idea {
  id: number
  title: string
  body: string | null
  status: IdeaStatus
  createdAt: string | null
}

interface IdeasTabProps {
  readonly apiClient: ApiClient
  readonly projectId: string
}

const STATUS_NEXT: Record<IdeaStatus, IdeaStatus> = {
  'idea': 'in-progress',
  'in-progress': 'done',
  'done': 'idea',
}

const STATUS_ICON: Record<IdeaStatus, string> = {
  'idea': '\u2606',
  'in-progress': '\u25D1',
  'done': '\u2713',
}

const STATUS_COLOR: Record<IdeaStatus, string> = {
  'idea': COLORS.textMuted,
  'in-progress': '#6366f1',
  'done': '#22c55e',
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  height: '100%',
  width: '100%',
  overflow: 'hidden',
}

const inputRowStyle = {
  display: 'flex',
  gap: '6px',
  padding: '8px',
  borderBottom: `1px solid ${COLORS.panelBorder}`,
}

const inputStyle = {
  flex: 1,
  padding: '5px 8px',
  borderRadius: '4px',
  border: `1px solid ${COLORS.panelBorder}`,
  backgroundColor: 'rgba(0,0,0,0.3)',
  color: COLORS.textBright,
  fontSize: '12px',
  fontFamily: 'inherit',
  outline: 'none',
}

const addBtnStyle = {
  padding: '5px 10px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#6366f1',
  color: '#fff',
  fontSize: '11px',
  cursor: 'pointer',
  flexShrink: 0,
}

const listStyle = {
  flex: 1,
  overflowY: 'auto' as const,
  padding: '4px 0',
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 8px',
  borderBottom: `1px solid ${COLORS.panelBorder}`,
}

const titleStyle = {
  flex: 1,
  fontSize: '12px',
  color: COLORS.textBright,
  lineHeight: '1.3',
  wordBreak: 'break-word' as const,
}

const footerStyle = {
  borderTop: `1px solid ${COLORS.panelBorder}`,
  padding: '6px 8px',
}

export function IdeasTab({ apiClient, projectId }: IdeasTabProps) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    apiClient.listIdeas(projectId)
      .then((data) => {
        if (!controller.signal.aborted) {
          setIdeas((data as Idea[]) ?? [])
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [projectId])

  const handleAdd = useCallback(async () => {
    const title = draft.trim()
    if (!title || adding) return
    setAdding(true)
    const optimistic: Idea = {
      id: Date.now(),
      title,
      body: null,
      status: 'idea',
      createdAt: null,
    }
    setIdeas((prev) => [optimistic, ...prev])
    setDraft('')
    try {
      const created = await apiClient.createIdea({
        projectId,
        title,
      }) as Idea
      setIdeas((prev) =>
        prev.map((i) => (i.id === optimistic.id ? created : i))
      )
    } catch {
      setIdeas((prev) => prev.filter((i) => i.id !== optimistic.id))
    } finally {
      setAdding(false)
    }
  }, [draft, adding, projectId, apiClient])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleAdd()
    },
    [handleAdd]
  )

  const cycleStatus = useCallback(
    async (idea: Idea) => {
      const next = STATUS_NEXT[idea.status]
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === idea.id ? { ...i, status: next } : i
        )
      )
      try {
        await apiClient.updateIdea(idea.id, { status: next })
      } catch {
        setIdeas((prev) =>
          prev.map((i) =>
            i.id === idea.id ? { ...i, status: idea.status } : i
          )
        )
      }
    },
    [apiClient]
  )

  const handleDelete = useCallback(
    async (id: number) => {
      setIdeas((prev) => prev.filter((i) => i.id !== id))
      await apiClient.deleteIdea(id).catch(() => {})
    },
    [apiClient]
  )

  const handleCopy = useCallback(() => {
    const open = ideas.filter((i) => i.status !== 'done')
    const lines = open.map((i) => {
      const prefix =
        i.status === 'in-progress' ? '- [ ] (in-progress)' : '- [ ]'
      return `${prefix} ${i.title}`
    })
    const text = `### Ideas \u2014 ${projectId}\n${lines.join('\n')}`
    navigator.clipboard?.writeText(text).catch(() => {})
  }, [ideas, projectId])

  const emptyStyle = {
    padding: '16px 8px',
    fontSize: '11px',
    color: COLORS.textMuted,
    textAlign: 'center' as const,
  }

  const statusBtnStyle = (status: IdeaStatus) => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: STATUS_COLOR[status],
    padding: '0 2px',
    flexShrink: 0,
  })

  const deleteBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '11px',
    color: COLORS.textMuted,
    padding: '0 2px',
    flexShrink: 0,
  }

  return h(
    'div',
    { style: containerStyle },
    h(
      'div',
      { style: inputRowStyle },
      h('input', {
        style: inputStyle,
        placeholder: 'New idea\u2026',
        value: draft,
        onInput: (e: Event) =>
          setDraft((e.target as HTMLInputElement).value),
        onKeyDown: handleKeyDown,
      }),
      h(
        'button',
        { style: addBtnStyle, onClick: handleAdd, disabled: adding },
        '+'
      )
    ),
    h(
      'div',
      { style: listStyle },
      ideas.length === 0
        ? h('div', { style: emptyStyle }, 'No ideas yet')
        : ideas.map((idea) =>
            h(
              'div',
              { key: idea.id, style: rowStyle },
              h(
                'button',
                {
                  onClick: () => cycleStatus(idea),
                  style: statusBtnStyle(idea.status),
                  title: `Status: ${idea.status} \u2014 click to cycle`,
                },
                STATUS_ICON[idea.status]
              ),
              h(
                'span',
                {
                  style: {
                    ...titleStyle,
                    opacity: idea.status === 'done' ? 0.5 : 1,
                  },
                },
                idea.title
              ),
              h(
                'button',
                {
                  onClick: () => handleDelete(idea.id),
                  style: deleteBtnStyle,
                  title: 'Delete',
                },
                '\u00D7'
              )
            )
          )
    ),
    h(
      'div',
      { style: footerStyle },
      h(
        'button',
        {
          style: { ...copyClaudeBtnStyle, width: '100%', padding: '5px 0' },
          onClick: handleCopy,
        },
        'Copy for Claude'
      )
    )
  )
}
