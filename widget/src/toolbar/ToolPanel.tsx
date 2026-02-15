import { h } from 'preact'
import { useState, useCallback } from 'preact/hooks'
import {
  COLORS,
  panelStyle,
  panelHeaderStyle,
  panelTitleStyle,
  closeBtnStyle,
  toolListStyle,
  toolBtnStyle,
  toolIconStyle,
  toolContentStyle,
  panelSlideIn,
  panelSlideOut,
} from './styles'
import { ConsoleViewer } from '../tools/ConsoleViewer'
import { NetworkViewer } from '../tools/NetworkViewer'
import { ErrorListViewer } from '../tools/ErrorOverlay'
import { BugReporter } from '../tools/BugReporter'
import { AIChat } from '../tools/AIChat'
import type { ApiClient } from '../api/client'
import type { ErrorEntry } from '../interceptors/errors'

interface ToolDef {
  readonly id: string
  readonly label: string
  readonly icon: string
}

const TOOLS: readonly ToolDef[] = [
  { id: 'console', label: 'Console Viewer', icon: '>' },
  { id: 'network', label: 'Network Viewer', icon: '\u{21C5}' },
  { id: 'errors', label: 'Error Log', icon: '\u{26A0}' },
  { id: 'bugs', label: 'Bug Reporter', icon: '\u{1F41B}' },
  { id: 'perf', label: 'Performance', icon: '\u{26A1}' },
  { id: 'ai', label: 'AI Assistant', icon: '\u{2728}' },
] as const

interface ToolPanelProps {
  readonly projectId: string
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly apiClient: ApiClient
  readonly apiBase: string
  readonly pinHash: string
}

export function ToolPanel({ projectId, isOpen, onClose, apiClient, apiBase, pinHash }: ToolPanelProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [hoverClose, setHoverClose] = useState(false)
  const [hoverTool, setHoverTool] = useState<string | null>(null)
  const [bugPrefillTitle, setBugPrefillTitle] = useState('')
  const [bugPrefillStack, setBugPrefillStack] = useState('')

  const handleToolClick = useCallback((toolId: string) => {
    // When switching away from bugs, clear prefill state
    setActiveTool((prev) => {
      if (prev === 'bugs' && toolId !== 'bugs') {
        setBugPrefillTitle('')
        setBugPrefillStack('')
      }
      return prev === toolId ? null : toolId
    })
  }, [])

  const handleReportBug = useCallback((entry: ErrorEntry) => {
    setBugPrefillTitle(entry.message)
    setBugPrefillStack(entry.stack)
    setActiveTool('bugs')
  }, [])

  const activeToolDef = activeTool
    ? TOOLS.find((t) => t.id === activeTool)
    : null

  const slideTransform = isOpen ? panelSlideIn : panelSlideOut

  return h(
    'div',
    {
      style: {
        ...panelStyle,
        transform: slideTransform,
        transition: 'transform 0.25s ease',
        pointerEvents: isOpen ? 'auto' : 'none',
      },
      'aria-hidden': !isOpen,
    },
    // Header
    h(
      'div',
      { style: panelHeaderStyle },
      h('span', { style: panelTitleStyle, title: projectId }, projectId),
      h(
        'button',
        {
          style: {
            ...closeBtnStyle,
            backgroundColor: hoverClose ? COLORS.closeBtnHover : 'transparent',
            color: hoverClose ? '#fff' : COLORS.textMuted,
          },
          onClick: onClose,
          onMouseEnter: () => setHoverClose(true),
          onMouseLeave: () => setHoverClose(false),
          'aria-label': 'Close panel',
          title: 'Close',
        },
        '\u{2715}'
      )
    ),
    // Tool list
    h(
      'div',
      { style: toolListStyle },
      TOOLS.map((tool) => {
        const isActive = activeTool === tool.id
        const isHovered = hoverTool === tool.id
        let bg: string = COLORS.toolBtnBg
        if (isActive) {
          bg = COLORS.toolBtnBgActive
        } else if (isHovered) {
          bg = COLORS.toolBtnBgHover
        }

        return h(
          'button',
          {
            key: tool.id,
            style: {
              ...toolBtnStyle,
              backgroundColor: bg,
              color: isActive ? '#fff' : COLORS.text,
            },
            onClick: () => handleToolClick(tool.id),
            onMouseEnter: () => setHoverTool(tool.id),
            onMouseLeave: () => setHoverTool(null),
          },
          h('span', { style: toolIconStyle }, tool.icon),
          h('span', null, tool.label)
        )
      })
    ),
    // Active tool content area
    activeToolDef
      ? h(
          'div',
          {
            style: {
              ...toolContentStyle,
              borderTop: `1px solid ${COLORS.panelBorder}`,
              // Reset centering for viewers that need full layout
              ...(activeTool === 'console'
                || activeTool === 'network'
                || activeTool === 'errors'
                || activeTool === 'bugs'
                || activeTool === 'ai'
                ? {
                    alignItems: 'stretch',
                    justifyContent: 'stretch',
                    padding: '0',
                  }
                : {}),
            },
          },
          activeTool === 'console'
            ? h(ConsoleViewer, null)
            : activeTool === 'network'
              ? h(NetworkViewer, null)
              : activeTool === 'errors'
                ? h(ErrorListViewer, { onReportBug: handleReportBug })
                : activeTool === 'bugs'
                  ? h(BugReporter, {
                      apiClient,
                      projectId,
                      prefillTitle: bugPrefillTitle || undefined,
                      prefillStack: bugPrefillStack || undefined,
                    })
                  : activeTool === 'ai'
                    ? h(AIChat, { apiBase, pinHash })
                    : h(
                        'span',
                        null,
                        `${activeToolDef.label} -- coming soon`
                      )
        )
      : null
  )
}
