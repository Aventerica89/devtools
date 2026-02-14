/**
 * ErrorToast -- fixed-position toast at bottom-right that auto-shows
 * when an uncaught error occurs. Red-themed, auto-dismisses after 10s.
 */
import { h } from 'preact'
import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { setOnErrorCallback } from '../interceptors/errors'
import type { ErrorEntry } from '../interceptors/errors'
import { COLORS } from '../toolbar/styles'

const AUTO_DISMISS_MS = 10000

// -- Inline styles --

const toastContainerStyle: Record<string, string> = {
  position: 'fixed',
  bottom: '80px',
  right: '20px',
  width: '340px',
  maxHeight: '280px',
  backgroundColor: '#1a0000',
  border: '1px solid #dc2626',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(220, 38, 38, 0.3)',
  zIndex: '999997',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: COLORS.text,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

const toastHeaderStyle: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  backgroundColor: 'rgba(220, 38, 38, 0.2)',
  borderBottom: '1px solid #dc2626',
  flexShrink: '0',
}

const toastTitleStyle: Record<string, string> = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#fca5a5',
}

const toastBtnGroupStyle: Record<string, string> = {
  display: 'flex',
  gap: '6px',
}

const toastBtnStyle: Record<string, string> = {
  padding: '3px 8px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: '500',
}

const reportBtnStyle: Record<string, string> = {
  ...toastBtnStyle,
  backgroundColor: '#dc2626',
  color: '#fff',
}

const dismissBtnStyle: Record<string, string> = {
  ...toastBtnStyle,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: COLORS.textMuted,
}

const toastBodyStyle: Record<string, string> = {
  padding: '8px 12px',
  overflowY: 'auto',
  flex: '1',
}

const messageStyle: Record<string, string> = {
  fontSize: '12px',
  fontWeight: '500',
  color: '#fca5a5',
  marginBottom: '6px',
  wordBreak: 'break-word',
}

const stackContainerStyle: Record<string, string> = {
  fontSize: '10px',
  fontFamily: 'monospace',
  lineHeight: '1.6',
  color: COLORS.textMuted,
}

const stackFrameStyle: Record<string, string> = {
  padding: '1px 0',
  wordBreak: 'break-all',
}

const stackFrameDimStyle: Record<string, string> = {
  ...stackFrameStyle,
  opacity: '0.5',
}

// -- Helpers --

function parseStack(stack: string): readonly string[] {
  if (!stack) return []
  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function isNodeModulesFrame(frame: string): boolean {
  return frame.includes('node_modules')
}

// -- Component --

interface ErrorToastProps {
  readonly onReportBug: (entry: ErrorEntry) => void
}

export function ErrorToast({ onReportBug }: ErrorToastProps) {
  const [latestError, setLatestError] = useState<ErrorEntry | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    setLatestError(null)
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
  }, [])

  const startDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
    }
    dismissTimerRef.current = setTimeout(() => {
      setLatestError(null)
      dismissTimerRef.current = null
    }, AUTO_DISMISS_MS)
  }, [])

  useEffect(() => {
    setOnErrorCallback((entry: ErrorEntry) => {
      setLatestError(entry)
      startDismissTimer()
    })

    return () => {
      setOnErrorCallback(null)
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current)
      }
    }
  }, [startDismissTimer])

  const handleMouseEnter = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (latestError) {
      startDismissTimer()
    }
  }, [latestError, startDismissTimer])

  const handleReport = useCallback(() => {
    if (latestError) {
      onReportBug(latestError)
      dismiss()
    }
  }, [latestError, onReportBug, dismiss])

  if (!latestError) return null

  const frames = parseStack(latestError.stack)

  return h(
    'div',
    {
      style: toastContainerStyle,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    h(
      'div',
      { style: toastHeaderStyle },
      h(
        'span',
        { style: toastTitleStyle },
        latestError.type === 'error'
          ? 'Uncaught Error'
          : 'Unhandled Rejection'
      ),
      h(
        'div',
        { style: toastBtnGroupStyle },
        h(
          'button',
          { style: reportBtnStyle, onClick: handleReport },
          'Report Bug'
        ),
        h(
          'button',
          { style: dismissBtnStyle, onClick: dismiss },
          'Dismiss'
        )
      )
    ),
    h(
      'div',
      { style: toastBodyStyle },
      h('div', { style: messageStyle }, latestError.message),
      frames.length > 0
        ? h(
            'div',
            { style: stackContainerStyle },
            frames.slice(0, 8).map((frame, i) =>
              h(
                'div',
                {
                  key: i,
                  style: isNodeModulesFrame(frame)
                    ? stackFrameDimStyle
                    : stackFrameStyle,
                },
                frame
              )
            )
          )
        : null
    )
  )
}
