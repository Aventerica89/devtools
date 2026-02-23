import { h } from 'preact'
import { useState, useCallback, useEffect, useRef } from 'preact/hooks'
import {
  PANEL_WIDTH,
  panelStyle,
  panelHeaderStyle,
  closeBtnStyle,
  toolContentStyle,
  domainInfoStyle,
  domainDotStyle,
  headerActionsStyle,
  iconBtnStyle,
  copyClaudeBtnStyle,
  tabBarStyle,
  tabStyle,
  activeTabStyle,
  tabBadgeStyle,
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
import { IdeasTab } from '../tools/IdeasTab'
import type { ApiClient } from '../api/client'
import type { ErrorEntry } from '../interceptors/errors'
import { buildCopyForClaudeBundle } from '../lib/copy'
import { getConsoleEntries } from '../interceptors/console'
import { getNetworkEntries } from '../interceptors/network'
import { getErrorEntries } from '../interceptors/errors'
import { getHealthIssues } from '../interceptors/health'

interface TabDef {
  readonly id: string
  readonly label: string
  readonly icon: string
  readonly badge?: number
}

const TABS: readonly Omit<TabDef, 'badge'>[] = [
  { id: 'console', label: 'Console', icon: '>_' },
  { id: 'network', label: 'Network', icon: '\u21C4' },
  { id: 'errors', label: 'Errors', icon: '\u26A0' },
  { id: 'perf', label: 'Perf', icon: '\u26A1' },
  { id: 'storage', label: 'Storage', icon: '\u25EB' },
  { id: 'dom', label: 'DOM', icon: '\u2B21' },
  { id: 'health', label: 'Health', icon: '\u2665' },
  { id: 'routines', label: 'Routines', icon: '\u2713' },
  { id: 'ideas', label: 'Ideas', icon: '\u2606' },
  { id: 'ai', label: 'AI', icon: '\u2726' },
  { id: 'bugs', label: 'Bugs', icon: '\u2316' },
  { id: 'snapshot', label: 'Snapshot', icon: '\u25CE' },
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
  const [activeTab, setActiveTab] = useState<string>('errors')
  const [isMinimized, setIsMinimized] = useState(false)
  const [hoverClose, setHoverClose] = useState(false)
  const [hoverTab, setHoverTab] = useState<string | null>(null)
  const [bugPrefillTitle, setBugPrefillTitle] = useState('')
  const [bugPrefillStack, setBugPrefillStack] = useState('')
  const [badges, setBadges] = useState({ errors: 0, console: 0 })

  const domain = typeof window !== 'undefined' ? window.location.hostname : projectId

  // Draggable panel position — starts above the FAB (bottom-right area), user can drag header to move
  const [panelPos, setPanelPos] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200
    const h = typeof window !== 'undefined' ? window.innerHeight : 800
    const panelH = Math.min(h * 0.85, 520)
    return {
      x: Math.max(0, w - PANEL_WIDTH - 24),   // right: 24px matches FAB offset
      y: Math.max(0, h - panelH - 82),         // above FAB (FAB bottom: 24px + height 48px + gap 10px)
    }
  })
  const [isDraggingPanel, setIsDraggingPanel] = useState(false)
  const panelDragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)

  // Badge count polling
  useEffect(() => {
    function update() {
      setBadges({
        errors: getErrorEntries().length,
        console: getConsoleEntries().filter((e) => e.level === 'warn' || e.level === 'error').length,
      })
    }
    update()
    const timer = setInterval(update, 2000)
    return () => clearInterval(timer)
  }, [])

  // Ideas badge: poll open idea count
  const [ideaCount, setIdeaCount] = useState(0)
  useEffect(() => {
    function fetchCount() {
      apiClient.listIdeas(projectId)
        .then((data) => {
          const all = (data as Array<{ status: string }>) ?? []
          setIdeaCount(all.filter((i) => i.status !== 'done').length)
        })
        .catch(() => {})
    }
    fetchCount()
    const timer = setInterval(fetchCount, 10000)
    return () => clearInterval(timer)
  }, [projectId, apiClient])

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

  const handleReportBug = useCallback((entry: ErrorEntry) => {
    setBugPrefillTitle(entry.message)
    setBugPrefillStack(entry.stack)
    setActiveTab('bugs')
  }, [])

  const handleTabClick = useCallback((tabId: string) => {
    // When switching away from bugs, clear prefill state
    if (activeTab === 'bugs' && tabId !== 'bugs') {
      setBugPrefillTitle('')
      setBugPrefillStack('')
    }
    setActiveTab(tabId)
  }, [activeTab])

  function renderTabContent() {
    switch (activeTab) {
      case 'console':
        return h(ConsoleViewer, null)
      case 'network':
        return h(NetworkViewer, null)
      case 'errors':
        return h(ErrorListViewer, { onReportBug: handleReportBug })
      case 'bugs':
        return h(BugReporter, {
          apiClient,
          projectId,
          prefillTitle: bugPrefillTitle || undefined,
          prefillStack: bugPrefillStack || undefined,
        })
      case 'perf':
        return h(PerfViewer, null)
      case 'storage':
        return h(StorageViewer, null)
      case 'health':
        return h(HealthViewer, null)
      case 'routines':
        return h(RoutinesTab, { apiBase, pinHash, projectId })
      case 'ideas':
        return h(IdeasTab, { apiClient, projectId })
      case 'ai':
        return h(AIChat, { apiBase, pinHash })
      case 'snapshot':
        return h(DebugSnapshot, null)
      case 'dom':
        return h(
          'div',
          {
            style: {
              padding: '40px 20px',
              textAlign: 'center',
              color: '#334155',
              fontSize: 13,
            },
          },
          'Click any element on the page to inspect it.'
        )
      default:
        return h('div', { style: { padding: '40px 20px', textAlign: 'center', color: '#334155', fontSize: 13 } }, `${activeTab} — coming soon`)
    }
  }

  return h(
    'div',
    {
      style: {
        ...panelStyle,
        left: `${panelPos.x}px`,
        top: `${panelPos.y}px`,
        height: isMinimized ? 'auto' : 'min(85vh, 520px)',
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
        },
        onPointerDown: handleHeaderPointerDown,
        onPointerMove: handleHeaderPointerMove,
        onPointerUp: handleHeaderPointerUp,
      },
      // Left: green dot + domain name
      h(
        'div',
        { style: domainInfoStyle },
        h('div', { style: domainDotStyle }),
        h('span', null, domain)
      ),
      // Right: action buttons
      h(
        'div',
        { style: headerActionsStyle },
        h(
          'button',
          {
            style: copyClaudeBtnStyle,
            title: 'Copy full page context for Claude',
            onClick: () => {
              const bundle = buildCopyForClaudeBundle(
                [...getConsoleEntries()],
                [...getNetworkEntries()],
                [...getErrorEntries()],
                getHealthIssues(),
              )
              navigator.clipboard.writeText(bundle).catch(() => {})
            },
          },
          'Copy for Claude'
        ),
        h(
          'button',
          {
            style: iconBtnStyle,
            title: 'Minimize',
            onClick: () => setIsMinimized((v) => !v),
          },
          '\u2014'
        ),
        h(
          'button',
          {
            style: {
              ...closeBtnStyle,
              backgroundColor: hoverClose ? '#ef4444' : 'transparent',
              color: hoverClose ? '#fff' : '#475569',
            },
            onClick: onClose,
            onMouseEnter: () => setHoverClose(true),
            onMouseLeave: () => setHoverClose(false),
            'aria-label': 'Close panel',
            title: 'Close',
          },
          '\u2715'
        )
      )
    ),
    // Tab bar (hidden when minimized)
    isMinimized ? null : h(
      'div',
      { style: tabBarStyle },
      TABS.map((tab) => {
        const isActive = activeTab === tab.id
        const badgeCount = tab.id === 'errors' ? badges.errors : tab.id === 'console' ? badges.console : tab.id === 'ideas' ? ideaCount : 0
        const isWarnBadge = tab.id === 'console'
        const isIdeaBadge = tab.id === 'ideas'

        return h(
          'button',
          {
            key: tab.id,
            style: {
              ...tabStyle,
              ...(isActive ? activeTabStyle : {}),
              // Ensure inactive tabs keep the 2px transparent bottom border to prevent layout shift
              borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
              // Hover color for non-active tabs (matches mockup: #94a3b8)
              color: isActive ? '#a5b4fc' : hoverTab === tab.id ? '#94a3b8' : '#475569',
            },
            onClick: () => handleTabClick(tab.id),
            onMouseEnter: () => setHoverTab(tab.id),
            onMouseLeave: () => setHoverTab(null),
          },
          tab.icon,
          ' ',
          tab.label,
          badgeCount > 0
            ? h(
                'span',
                {
                  style: isIdeaBadge
                    ? { ...tabBadgeStyle, background: '#6366f1' }
                    : isWarnBadge
                    ? { ...tabBadgeStyle, background: '#d97706' }
                    : tabBadgeStyle,
                },
                badgeCount
              )
            : null
        )
      })
    ),
    // Content area (hidden when minimized)
    isMinimized ? null : h(
      'div',
      {
        style: {
          ...toolContentStyle,
          padding: 0,
        },
      },
      h(
        'div',
        {
          style: {
            height: '100%',
            overflowY: 'auto',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#94a3b8',
          },
        },
        renderTabContent()
      )
    )
  )
}
