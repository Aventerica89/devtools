import { h } from 'preact'
import { useState, useCallback, useRef } from 'preact/hooks'
import {
  COLORS,
  PANEL_WIDTH,
  panelStyle,
  panelHeaderStyle,
  panelTitleStyle,
  closeBtnStyle,
  toolListStyle,
  toolBtnStyle,
  toolIconStyle,
  toolContentStyle,
} from './styles'
import { ConsoleViewer } from '../tools/ConsoleViewer'
import { NetworkViewer } from '../tools/NetworkViewer'
import { ErrorListViewer } from '../tools/ErrorOverlay'
import { BugReporter } from '../tools/BugReporter'
import { AIChat } from '../tools/AIChat'
import { PerfViewer } from '../tools/PerfViewer'
import { DebugSnapshot } from '../tools/DebugSnapshot'
import { StorageViewer } from '../tools/StorageViewer'
import { HealthViewer } from '../tools/HealthViewer'
import { RoutinesTab } from '../tools/RoutinesTab'
import type { ApiClient } from '../api/client'
import type { ErrorEntry } from '../interceptors/errors'

interface ToolDef {
  readonly id: string
  readonly label: string
  readonly icon: string
}

const TOOLS: readonly ToolDef[] = [
  { id: 'debug', label: 'Debug Snapshot', icon: '\u{229A}' },
  { id: 'console', label: 'Console Viewer', icon: '>' },
  { id: 'network', label: 'Network Viewer', icon: '\u{21C5}' },
  { id: 'errors', label: 'Error Log', icon: '\u{26A0}' },
  { id: 'bugs', label: 'Bug Reporter', icon: '\u{1F41B}' },
  { id: 'perf', label: 'Performance', icon: '\u{26A1}' },
  { id: 'storage', label: 'Storage', icon: '\u{1F5C4}' },
  { id: 'health', label: 'Health', icon: '\u2764' },
  { id: 'routines', label: 'Routines', icon: '\u2713' },
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

  // Draggable panel position — starts at top-right, user can drag header to move
  const [panelPos, setPanelPos] = useState(() => ({
    x: Math.max(0, window.innerWidth - PANEL_WIDTH - 4),
    y: 0,
  }))
  const [isDraggingPanel, setIsDraggingPanel] = useState(false)
  const panelDragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)

  const handleHeaderPointerDown = useCallback((e: PointerEvent) => {
    if ((e.target as Element).closest('button')) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    panelDragRef.current = { startX: e.clientX, startY: e.clientY, originX: panelPos.x, originY: panelPos.y }
    setIsDraggingPanel(true)
  }, [panelPos.x, panelPos.y])

  const handleHeaderPointerMove = useCallback((e: PointerEvent) => {
    if (!panelDragRef.current) return
    const { startX, startY, originX, originY } = panelDragRef.current
    const maxX = window.innerWidth - PANEL_WIDTH
    const maxY = window.innerHeight - 48
    setPanelPos({
      x: Math.max(0, Math.min(maxX, originX + (e.clientX - startX))),
      y: Math.max(0, Math.min(maxY, originY + (e.clientY - startY))),
    })
  }, [])

  const handleHeaderPointerUp = useCallback(() => {
    panelDragRef.current = null
    setIsDraggingPanel(false)
  }, [])

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

  return h(
    'div',
    {
      style: {
        ...panelStyle,
        left: `${panelPos.x}px`,
        top: `${panelPos.y}px`,
        height: 'min(85vh, 700px)',
        opacity: isOpen ? '1' : '0',
        transition: 'opacity 0.2s ease',
        pointerEvents: isOpen ? 'auto' : 'none',
      },
      'aria-hidden': !isOpen,
    },
    // Header — drag handle
    h(
      'div',
      {
        style: {
          ...panelHeaderStyle,
          cursor: isDraggingPanel ? 'grabbing' : 'grab',
          userSelect: 'none',
        },
        onPointerDown: handleHeaderPointerDown,
        onPointerMove: handleHeaderPointerMove,
        onPointerUp: handleHeaderPointerUp,
      },
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
              ...(activeTool === 'debug'
                || activeTool === 'console'
                || activeTool === 'network'
                || activeTool === 'errors'
                || activeTool === 'bugs'
                || activeTool === 'perf'
                || activeTool === 'storage'
                || activeTool === 'health'
                || activeTool === 'routines'
                || activeTool === 'ai'
                ? {
                    alignItems: 'stretch',
                    justifyContent: 'stretch',
                    padding: '0',
                  }
                : {}),
            },
          },
          activeTool === 'debug'
            ? h(DebugSnapshot, null)
            : activeTool === 'console'
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
                    : activeTool === 'perf'
                      ? h(PerfViewer, null)
                      : activeTool === 'storage'
                        ? h(StorageViewer, null)
                        : activeTool === 'health'
                          ? h(HealthViewer, null)
                          : activeTool === 'routines'
                            ? h(RoutinesTab, { apiBase, pinHash, projectId })
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
