/**
 * AIChat -- mini chat interface for the AI Assistant tool in ToolPanel.
 * Sends prompts to /api/ai/analyze and displays streaming responses.
 */
import { h } from 'preact'
import { useState, useCallback, useRef } from 'preact/hooks'
import { COLORS } from '../toolbar/styles'
import { getConsoleEntries } from '../interceptors/console'
import { getNetworkEntries } from '../interceptors/network'
import { getErrorEntries } from '../interceptors/errors'

// -- Types --

interface AIChatProps {
  readonly apiBase: string
  readonly pinHash: string
}

type ChatState = 'idle' | 'loading' | 'streaming' | 'error'

// -- Styles --

const containerStyle: Record<string, string> = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  padding: '8px',
  gap: '8px',
  boxSizing: 'border-box',
}

const inputRowStyle: Record<string, string> = {
  display: 'flex',
  gap: '6px',
  flexShrink: '0',
}

const inputStyle: Record<string, string> = {
  flex: '1',
  padding: '6px 8px',
  borderRadius: '4px',
  border: `1px solid ${COLORS.panelBorder}`,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  color: COLORS.text,
  fontSize: '12px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const sendBtnStyle: Record<string, string> = {
  padding: '6px 10px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: COLORS.fabBg,
  color: '#fff',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
  flexShrink: '0',
}

const sendBtnDisabledStyle: Record<string, string> = {
  ...sendBtnStyle,
  opacity: '0.5',
  cursor: 'not-allowed',
}

const responseAreaStyle: Record<string, string> = {
  flex: '1',
  overflowY: 'auto',
  fontSize: '12px',
  lineHeight: '1.5',
  color: COLORS.text,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  padding: '8px',
  borderRadius: '4px',
  minHeight: '80px',
}

const placeholderStyle: Record<string, string> = {
  ...responseAreaStyle,
  color: COLORS.textMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontStyle: 'italic',
}

const errorBoxStyle: Record<string, string> = {
  padding: '8px',
  fontSize: '12px',
  color: '#ef4444',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  borderRadius: '4px',
}

// -- Helpers --

function buildPageContext(): string {
  const errors = getErrorEntries().slice(0, 5)
    .map((e) => `- ${e.message}`).join('\n')
  const net = getNetworkEntries().filter((e) => e.status >= 400).slice(0, 5)
    .map((e) => `- ${e.method} ${e.url} \u2192 ${e.status}`).join('\n')
  const cons = getConsoleEntries()
    .filter((e) => e.level === 'error' || e.level === 'warn').slice(0, 5)
    .map((e) => `[${e.level}] ${e.args.join(' ')}`).join('\n')
  const parts = [
    `Page: ${window.location.href}`,
    errors && `Recent errors:\n${errors}`,
    net && `Network issues:\n${net}`,
    cons && `Console issues:\n${cons}`,
  ].filter(Boolean)
  return parts.join('\n\n')
}

// -- Component --

export function AIChat({ apiBase, pinHash }: AIChatProps) {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [chatState, setChatState] = useState<ChatState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const sentCountRef = useRef(0)

  const canSend = prompt.trim().length > 0
    && chatState !== 'loading'
    && chatState !== 'streaming'

  const handleSend = useCallback(async () => {
    if (prompt.trim().length === 0 || chatState === 'loading' || chatState === 'streaming') return

    const text = prompt.trim()
    const context = sentCountRef.current === 0 ? buildPageContext() : ''
    const messageWithContext = context
      ? `Context:\n${context}\n\n---\n\n${text}`
      : text
    const cappedMessage = messageWithContext.slice(0, 2000)
    setResponse('')
    setChatState('loading')
    setErrorMsg('')

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
          text: cappedMessage,
          context: window.location.href,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`)
      }

      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      setChatState('streaming')
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        if (chunk) {
          setResponse((prev) => prev + chunk)
        }
      }

      sentCountRef.current += 1
      setChatState('idle')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setChatState('error')
      const msg = err instanceof Error
        ? err.message
        : 'Analysis failed'
      setErrorMsg(msg)
    }
  }, [prompt, chatState, apiBase, pinHash])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && canSend) {
        e.preventDefault()
        handleSend()
      }
    },
    [canSend, handleSend]
  )

  return h(
    'div',
    { style: containerStyle },
    // Input row
    h(
      'div',
      { style: inputRowStyle },
      h('input', {
        style: inputStyle,
        type: 'text',
        value: prompt,
        placeholder: 'Ask about code, errors, concepts...',
        onInput: (e: Event) => {
          setPrompt((e.target as HTMLInputElement).value)
        },
        onKeyDown: handleKeyDown,
      }),
      h(
        'button',
        {
          style: canSend ? sendBtnStyle : sendBtnDisabledStyle,
          onClick: handleSend,
          disabled: !canSend,
        },
        chatState === 'loading' || chatState === 'streaming'
          ? '...'
          : 'Send'
      )
    ),
    // Error
    chatState === 'error'
      ? h('div', { style: errorBoxStyle }, errorMsg)
      : null,
    // Response area
    response
      ? h('div', { style: responseAreaStyle }, response)
      : h(
          'div',
          { style: placeholderStyle },
          chatState === 'loading'
            ? 'Thinking...'
            : 'Response will appear here'
        )
  )
}
