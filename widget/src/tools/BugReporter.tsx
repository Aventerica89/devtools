/**
 * BugReporter -- form for reporting bugs via the API.
 * Can be used standalone from ToolPanel or triggered from ErrorOverlay.
 */
import { h } from 'preact'
import { useState, useCallback } from 'preact/hooks'
import { COLORS } from '../toolbar/styles'
import type { ApiClient } from '../api/client'

// -- Types --

type Severity = 'low' | 'medium' | 'high' | 'critical'
type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

const SEVERITIES: readonly Severity[] = ['low', 'medium', 'high', 'critical']

const SEVERITY_COLORS: Record<Severity, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

// -- Props --

interface BugReporterProps {
  readonly apiClient: ApiClient
  readonly projectId: string
  readonly prefillTitle?: string
  readonly prefillStack?: string
  readonly onClose?: () => void
}

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

const labelStyle: Record<string, string> = {
  fontSize: '11px',
  fontWeight: '600',
  color: COLORS.textBright,
  marginBottom: '3px',
  display: 'block',
}

const inputStyle: Record<string, string> = {
  width: '100%',
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

const textareaStyle: Record<string, string> = {
  ...inputStyle,
  minHeight: '60px',
  resize: 'vertical',
  lineHeight: '1.4',
}

const severityGroupStyle: Record<string, string> = {
  display: 'flex',
  gap: '4px',
}

const severityBtnBase: Record<string, string> = {
  padding: '4px 8px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  flex: '1',
  textAlign: 'center',
}

const submitBtnStyle: Record<string, string> = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: COLORS.fabBg,
  color: '#fff',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
  width: '100%',
  marginTop: '4px',
}

const submitBtnDisabledStyle: Record<string, string> = {
  ...submitBtnStyle,
  opacity: '0.5',
  cursor: 'not-allowed',
}

const feedbackStyle: Record<string, string> = {
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '500',
  textAlign: 'center',
}

const successStyle: Record<string, string> = {
  ...feedbackStyle,
  backgroundColor: 'rgba(34, 197, 94, 0.15)',
  color: '#22c55e',
  border: '1px solid rgba(34, 197, 94, 0.3)',
}

const errorStyle: Record<string, string> = {
  ...feedbackStyle,
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.3)',
}

const stackPreviewStyle: Record<string, string> = {
  fontSize: '10px',
  fontFamily: 'monospace',
  color: COLORS.textMuted,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  padding: '6px 8px',
  borderRadius: '4px',
  maxHeight: '60px',
  overflowY: 'auto',
  lineHeight: '1.4',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
}

const closeBtnStyle: Record<string, string> = {
  padding: '4px 8px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: COLORS.textMuted,
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: '500',
  alignSelf: 'flex-end',
}

// -- Component --

export function BugReporter({
  apiClient,
  projectId,
  prefillTitle,
  prefillStack,
  onClose,
}: BugReporterProps) {
  const [title, setTitle] = useState(prefillTitle ?? '')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const canSubmit = title.trim().length > 0 && submitState !== 'submitting'

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    setSubmitState('submitting')
    setErrorMsg('')

    try {
      const bugData: Record<string, unknown> = {
        projectId,
        title: title.trim(),
        description: description.trim(),
        severity,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }

      if (prefillStack) {
        bugData.stackTrace = prefillStack
      }

      await apiClient.createBug(bugData)
      setSubmitState('success')
      setTitle('')
      setDescription('')
      setSeverity('medium')
    } catch (err) {
      setSubmitState('error')
      const msg = err instanceof Error
        ? err.message
        : 'Failed to submit bug report'
      setErrorMsg(msg)
    }
  }, [
    canSubmit, title, description, severity,
    projectId, prefillStack, apiClient,
  ])

  // After success, show message and allow new submission
  if (submitState === 'success') {
    return h(
      'div',
      { style: containerStyle },
      h('div', { style: successStyle }, 'Bug report submitted.'),
      h(
        'button',
        {
          style: { ...submitBtnStyle, marginTop: '8px' },
          onClick: () => setSubmitState('idle'),
        },
        'Report Another'
      ),
      onClose
        ? h(
            'button',
            {
              style: { ...closeBtnStyle, marginTop: '4px', alignSelf: 'center' },
              onClick: onClose,
            },
            'Close'
          )
        : null
    )
  }

  return h(
    'div',
    { style: containerStyle },
    // Close button (when opened from overlay)
    onClose
      ? h(
          'button',
          { style: closeBtnStyle, onClick: onClose },
          'Back'
        )
      : null,

    // Title
    h(
      'div',
      null,
      h('label', { style: labelStyle }, 'Title'),
      h('input', {
        style: inputStyle,
        type: 'text',
        value: title,
        placeholder: 'Describe the bug briefly',
        onInput: (e: Event) => {
          setTitle((e.target as HTMLInputElement).value)
        },
      })
    ),

    // Description
    h(
      'div',
      null,
      h('label', { style: labelStyle }, 'Description'),
      h('textarea', {
        style: textareaStyle,
        value: description,
        placeholder: 'Steps to reproduce, expected vs actual behavior',
        onInput: (e: Event) => {
          setDescription((e.target as HTMLTextAreaElement).value)
        },
      })
    ),

    // Stack trace preview (if pre-filled from error)
    prefillStack
      ? h(
          'div',
          null,
          h('label', { style: labelStyle }, 'Stack Trace'),
          h('div', { style: stackPreviewStyle }, prefillStack)
        )
      : null,

    // Severity selector
    h(
      'div',
      null,
      h('label', { style: labelStyle }, 'Severity'),
      h(
        'div',
        { style: severityGroupStyle },
        SEVERITIES.map((sev) =>
          h(
            'button',
            {
              key: sev,
              style: {
                ...severityBtnBase,
                backgroundColor: severity === sev
                  ? SEVERITY_COLORS[sev]
                  : COLORS.toolBtnBg,
                color: severity === sev ? '#fff' : COLORS.textMuted,
              },
              onClick: () => setSeverity(sev),
            },
            sev
          )
        )
      )
    ),

    // Error feedback
    submitState === 'error'
      ? h('div', { style: errorStyle }, errorMsg || 'Submission failed')
      : null,

    // Submit button
    h(
      'button',
      {
        style: canSubmit ? submitBtnStyle : submitBtnDisabledStyle,
        onClick: handleSubmit,
        disabled: !canSubmit,
      },
      submitState === 'submitting' ? 'Submitting...' : 'Submit Bug Report'
    )
  )
}
