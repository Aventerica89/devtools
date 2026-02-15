/**
 * QuickAI -- text selection analyzer.
 * Listens for mouseup events, shows "Analyze" button near selected text,
 * streams analysis from the dashboard AI endpoint.
 */
import { h } from 'preact'
import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { COLORS } from '../toolbar/styles'

// -- Types --

interface QuickAIProps {
  readonly apiBase: string
  readonly pinHash: string
}

interface SelectionPos {
  readonly x: number
  readonly y: number
}

type AnalysisState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

// -- Styles --

const analyzeBtnStyle: Record<string, string | number> = {
  position: 'fixed',
  padding: '6px 12px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: COLORS.fabBg,
  color: '#fff',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
  zIndex: 999999,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

const popupStyle: Record<string, string | number> = {
  position: 'fixed',
  width: '360px',
  maxHeight: '320px',
  backgroundColor: COLORS.panelBg,
  border: `1px solid ${COLORS.panelBorder}`,
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  zIndex: 999999,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  overflow: 'hidden',
}

const popupHeaderStyle: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  backgroundColor: COLORS.panelHeaderBg,
  borderBottom: `1px solid ${COLORS.panelBorder}`,
  flexShrink: 0,
}

const popupTitleStyle: Record<string, string | number> = {
  fontSize: '12px',
  fontWeight: '600',
  color: COLORS.textBright,
}

const popupCloseBtnStyle: Record<string, string | number> = {
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: 'transparent',
  color: COLORS.textMuted,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  lineHeight: '1',
}

const popupBodyStyle: Record<string, string | number> = {
  padding: '12px',
  overflowY: 'auto',
  flex: 1,
  fontSize: '13px',
  lineHeight: '1.5',
  color: COLORS.text,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const loadingStyle: Record<string, string | number> = {
  padding: '16px 12px',
  fontSize: '12px',
  color: COLORS.textMuted,
  textAlign: 'center',
}

const errorMsgStyle: Record<string, string | number> = {
  padding: '12px',
  fontSize: '12px',
  color: '#ef4444',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  borderRadius: '4px',
  margin: '8px 12px',
}

// -- Helpers --

function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number
): SelectionPos {
  const clampedX = Math.min(
    Math.max(x, 8),
    window.innerWidth - width - 8
  )
  const clampedY = Math.min(
    Math.max(y, 8),
    window.innerHeight - height - 8
  )
  return { x: clampedX, y: clampedY }
}

// No special parsing needed -- toTextStreamResponse()
// returns raw text chunks.

// -- Component --

export function QuickAI({ apiBase, pinHash }: QuickAIProps) {
  const [selectedText, setSelectedText] = useState('')
  const [btnPos, setBtnPos] = useState<SelectionPos | null>(null)
  const [popupPos, setPopupPos] = useState<SelectionPos | null>(null)
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle')
  const [result, setResult] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [hoverBtn, setHoverBtn] = useState(false)
  const [hoverClose, setHoverClose] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)

  // Dismiss everything
  const dismiss = useCallback(() => {
    setBtnPos(null)
    setPopupPos(null)
    setSelectedText('')
    setAnalysisState('idle')
    setResult('')
    setErrorMsg('')
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [])

  // Listen for text selection
  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      // Ignore clicks inside our own popup / button
      const target = e.target as HTMLElement
      if (target.closest?.('[data-quickai]')) return

      const sel = window.getSelection()
      const text = sel?.toString().trim() ?? ''

      if (text.length > 10) {
        setSelectedText(text)
        const pos = clampPosition(e.clientX, e.clientY - 40, 90, 30)
        setBtnPos(pos)
      } else if (!popupPos) {
        // Only dismiss button if no popup is showing
        setBtnPos(null)
        setSelectedText('')
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [popupPos])

  // Click outside to dismiss popup
  useEffect(() => {
    if (!popupPos) return

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest?.('[data-quickai]')) return
      dismiss()
    }

    // Delay adding listener to avoid capturing the click
    // that triggered the popup
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [popupPos, dismiss])

  // Start analysis
  const handleAnalyze = useCallback(async () => {
    if (!selectedText) return

    // Position popup near the button
    const pos = btnPos
      ? clampPosition(btnPos.x, btnPos.y + 36, 360, 320)
      : { x: 100, y: 100 }

    setPopupPos(pos)
    setBtnPos(null)
    setAnalysisState('loading')
    setResult('')
    setErrorMsg('')

    // Abort any previous request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${apiBase}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DevTools-Pin': pinHash,
        },
        body: JSON.stringify({
          text: selectedText,
          context: window.location.href,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Analysis failed (${res.status})`)
      }

      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      setAnalysisState('streaming')
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        if (chunk) {
          setResult((prev) => prev + chunk)
        }
      }

      setAnalysisState('done')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setAnalysisState('error')
      const msg = err instanceof Error
        ? err.message
        : 'Analysis failed'
      setErrorMsg(msg)
    }
  }, [selectedText, btnPos, apiBase, pinHash])

  // Render analyze button near selection
  const analyzeButton = btnPos
    ? h(
        'button',
        {
          'data-quickai': 'btn',
          style: {
            ...analyzeBtnStyle,
            left: `${btnPos.x}px`,
            top: `${btnPos.y}px`,
            backgroundColor: hoverBtn
              ? COLORS.fabBgHover
              : COLORS.fabBg,
          },
          onClick: handleAnalyze,
          onMouseEnter: () => setHoverBtn(true),
          onMouseLeave: () => setHoverBtn(false),
        },
        '\u2728 Analyze'
      )
    : null

  // Render analysis popup
  const analysisPopup = popupPos
    ? h(
        'div',
        {
          ref: popupRef,
          'data-quickai': 'popup',
          style: {
            ...popupStyle,
            left: `${popupPos.x}px`,
            top: `${popupPos.y}px`,
          },
        },
        // Header
        h(
          'div',
          { style: popupHeaderStyle },
          h('span', { style: popupTitleStyle }, 'AI Analysis'),
          h(
            'button',
            {
              style: {
                ...popupCloseBtnStyle,
                backgroundColor: hoverClose
                  ? COLORS.closeBtnHover
                  : 'transparent',
                color: hoverClose ? '#fff' : COLORS.textMuted,
              },
              onClick: dismiss,
              onMouseEnter: () => setHoverClose(true),
              onMouseLeave: () => setHoverClose(false),
              'aria-label': 'Close',
            },
            '\u2715'
          )
        ),
        // Body
        analysisState === 'loading'
          ? h('div', { style: loadingStyle }, 'Analyzing...')
          : analysisState === 'error'
            ? h('div', { style: errorMsgStyle }, errorMsg)
            : h('div', { style: popupBodyStyle }, result || 'Waiting...')
      )
    : null

  return h(
    'div',
    { 'data-quickai': 'root' },
    analyzeButton,
    analysisPopup
  )
}
