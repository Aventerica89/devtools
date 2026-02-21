import { h } from 'preact'
import { useState, useRef, useCallback, useEffect } from 'preact/hooks'
import { COLORS, DRAG_THRESHOLD, fabStyle } from './styles'
import { ToolPanel } from './ToolPanel'
import type { ApiClient } from '../api/client'
import { getErrorEntries } from '../interceptors/errors'
import { getConsoleEntries } from '../interceptors/console'

interface ToolbarProps {
  readonly projectId: string
  readonly pinHash: string
  readonly apiBase: string
  readonly apiClient: ApiClient
}

interface DragState {
  readonly isDragging: boolean
  readonly startX: number
  readonly startY: number
  readonly offsetX: number
  readonly offsetY: number
  readonly moved: boolean
}

const INITIAL_DRAG: DragState = {
  isDragging: false,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  moved: false,
}

// Wrench SVG icon (inline, under 300 chars)
const WRENCH_ICON = h(
  'svg',
  {
    width: '22',
    height: '22',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  },
  h('path', {
    d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  })
)

export function Toolbar({ projectId, pinHash, apiBase, apiClient }: ToolbarProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [fabHover, setFabHover] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [badgeCount, setBadgeCount] = useState(0)
  const dragRef = useRef<DragState>(INITIAL_DRAG)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  // Poll badge count every 2s (errors + console warns/errors)
  useEffect(() => {
    function update() {
      const errors = getErrorEntries().length
      const warns = getConsoleEntries().filter((e) => e.level === 'warn' || e.level === 'error').length
      setBadgeCount(errors + warns)
    }
    update()
    const timer = setInterval(update, 2000)
    return () => clearInterval(timer)
  }, [])

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const target = e.currentTarget as HTMLButtonElement
      target.setPointerCapture(e.pointerId)

      dragRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: position.x,
        offsetY: position.y,
        moved: false,
      }
      setIsDragging(true)
    },
    [position.x, position.y]
  )

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current
    if (!drag.isDragging) return

    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > DRAG_THRESHOLD) {
      dragRef.current = { ...drag, moved: true }
    }

    setPosition({
      x: drag.offsetX + dx,
      y: drag.offsetY + dy,
    })
  }, [])

  const handlePointerUp = useCallback(() => {
    const drag = dragRef.current
    const wasDragged = drag.moved

    dragRef.current = { ...INITIAL_DRAG }
    setIsDragging(false)

    if (!wasDragged) {
      setPanelOpen((prev) => !prev)
    }
  }, [])

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  // Compute FAB position: bottom-right with drag offset (24px matches mockup)
  const fabComputedStyle = {
    ...fabStyle,
    bottom: `${24 - position.y}px`,
    right: `${24 - position.x}px`,
    backgroundColor: fabHover ? COLORS.fabBgHover : COLORS.fabBg,
    boxShadow: fabHover
      ? '0 6px 20px rgba(99, 102, 241, 0.6)'
      : '0 4px 16px rgba(99, 102, 241, 0.5)',
    transform: fabHover ? 'scale(1.05)' : 'scale(1)',
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return h(
    'div',
    null,
    // Floating Action Button
    h(
      'button',
      {
        ref: btnRef,
        style: { ...fabComputedStyle, overflow: 'visible' },
        title: `DevTools (${projectId})`,
        'aria-label': 'Toggle DevTools panel',
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onMouseEnter: () => setFabHover(true),
        onMouseLeave: () => setFabHover(false),
      },
      WRENCH_ICON,
      badgeCount > 0
        ? h(
            'span',
            {
              style: {
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                background: '#ef4444',
                borderRadius: '50%',
                fontSize: '9px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                border: '2px solid #0f172a',
                lineHeight: '1',
              },
            },
            badgeCount > 99 ? '99+' : String(badgeCount)
          )
        : null
    ),
    // Tool Panel
    h(ToolPanel, {
      projectId,
      isOpen: panelOpen,
      onClose: handleClosePanel,
      apiClient,
      apiBase,
      pinHash,
    })
  )
}
