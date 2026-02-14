import { h } from 'preact'

interface ToolbarProps {
  readonly projectId: string
  readonly pinHash: string
  readonly apiBase: string
}

export function Toolbar({ projectId, pinHash, apiBase }: ToolbarProps) {
  return h('div', {
    style: {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 999999,
    },
  }, h('button', {
    style: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#6366f1',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: `DevTools (${projectId})`,
  }, '\u{1F6E0}'))
}
