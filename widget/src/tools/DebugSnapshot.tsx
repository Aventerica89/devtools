/**
 * DebugSnapshot — one-click debug report collector.
 *
 * Captures screenshots (paste or screen capture), then bundles them with
 * live console/network/error/storage data into a markdown report you can
 * paste straight into Claude or a GitHub issue.  Stores the last 5 reports
 * in localStorage so you can re-copy them later.
 */

import { h } from 'preact'
import { useState, useCallback, useEffect } from 'preact/hooks'
import { COLORS } from '../toolbar/styles'
import { getConsoleEntries } from '../interceptors/console'
import { getNetworkEntries } from '../interceptors/network'
import { getErrorEntries } from '../interceptors/errors'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Screenshot {
  readonly id: number
  readonly url: string   // object URL (in-memory only)
  readonly blob: Blob
  readonly name: string
}

interface SavedSnapshot {
  readonly id: string
  readonly timestamp: number
  readonly pageUrl: string
  readonly report: string
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'devtools-debug-snapshots'
const MAX_SAVED = 5

function loadSaved(): SavedSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedSnapshot[]) : []
  } catch {
    return []
  }
}

function persistSaved(list: SavedSnapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch { /* quota exceeded — silently skip */ }
}

// ---------------------------------------------------------------------------
// Report generation helpers
// ---------------------------------------------------------------------------

let screenshotSeq = 1

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

function storageSection(): string {
  const parts: string[] = []
  try {
    const keys = Object.keys(localStorage).filter((k) => k !== STORAGE_KEY)
    if (keys.length) {
      const rows = keys.slice(0, 30).map((k) => {
        const v = localStorage.getItem(k) ?? ''
        return `  ${k}: ${v.length > 120 ? v.slice(0, 120) + '…' : v}`
      })
      parts.push(`localStorage (${keys.length} keys):\n${rows.join('\n')}`)
    }
  } catch { /* sandboxed */ }
  try {
    const keys = Object.keys(sessionStorage)
    if (keys.length) {
      const rows = keys.slice(0, 30).map((k) => {
        const v = sessionStorage.getItem(k) ?? ''
        return `  ${k}: ${v.length > 120 ? v.slice(0, 120) + '…' : v}`
      })
      parts.push(`sessionStorage (${keys.length} keys):\n${rows.join('\n')}`)
    }
  } catch { /* sandboxed */ }
  return parts.length ? parts.join('\n\n') : '(empty)'
}

function timingSection(): string {
  try {
    const navEntries = performance.getEntriesByType('navigation')
    const nav = navEntries[0] as PerformanceNavigationTiming | undefined
    if (!nav) return '(not available)'
    return [
      `DNS: ${Math.round(nav.domainLookupEnd - nav.domainLookupStart)}ms`,
      `Connect: ${Math.round(nav.connectEnd - nav.connectStart)}ms`,
      `TTFB: ${Math.round(nav.responseStart - nav.requestStart)}ms`,
      `DOM Ready: ${Math.round(nav.domContentLoadedEventEnd)}ms`,
      `Page Load: ${Math.round(nav.loadEventEnd)}ms`,
    ].join(' | ')
  } catch {
    return '(not available)'
  }
}

function cookieNames(): string {
  try {
    const names = document.cookie
      .split(';')
      .map((c) => c.trim().split('=')[0])
      .filter(Boolean)
    return names.length ? names.join(', ') : '(none)'
  } catch {
    return '(unavailable)'
  }
}

function buildReport(shots: Screenshot[], errorsOnly: boolean): string {
  const now = new Date()
  const ts = now.toISOString().replace('T', ' ').slice(0, 19)
  const consoleAll = getConsoleEntries()
  const networkAll = getNetworkEntries()
  const errorAll = getErrorEntries()

  const consoleShow = errorsOnly
    ? consoleAll.filter((e) => e.level === 'error' || e.level === 'warn')
    : [...consoleAll]

  const networkShow = errorsOnly
    ? networkAll.filter((e) => e.status === 0 || e.status >= 400)
    : [...networkAll]

  const lines: string[] = []

  lines.push(`# Debug Snapshot — ${ts}`)
  lines.push('')
  lines.push(`**URL:** ${window.location.href}`)
  if (document.title) lines.push(`**Page:** ${document.title}`)
  lines.push(`**Viewport:** ${window.innerWidth} x ${window.innerHeight}`)
  lines.push(`**User-Agent:** ${navigator.userAgent}`)
  lines.push(`**Cookies:** ${cookieNames()}`)
  lines.push('')

  if (shots.length) {
    lines.push(`## Screenshots (${shots.length} downloaded)`)
    lines.push(shots.map((s) => s.name).join(', '))
    lines.push('')
  }

  const consoleLabel = errorsOnly
    ? `${consoleShow.length} warnings/errors of ${consoleAll.length} total`
    : `${consoleShow.length} entries`
  lines.push(`## Console — ${consoleLabel}`)
  if (!consoleShow.length) {
    lines.push('(none)')
  } else {
    for (const e of consoleShow.slice(-60)) {
      lines.push(`[${formatTime(e.timestamp)}] ${e.level.toUpperCase().padEnd(5)} ${e.args.join(' ')}`)
    }
  }
  lines.push('')

  const netLabel = errorsOnly
    ? `${networkShow.length} errors of ${networkAll.length} total`
    : `${networkShow.length} requests`
  lines.push(`## Network — ${netLabel}`)
  if (!networkShow.length) {
    lines.push('(none)')
  } else {
    for (const e of networkShow.slice(-40)) {
      const status = e.status === 0 ? 'ERR' : String(e.status)
      lines.push(`${e.method.padEnd(6)} ${e.url} — ${status} (${e.duration}ms)`)
    }
  }
  lines.push('')

  lines.push(`## JavaScript Errors — ${errorAll.length}`)
  if (!errorAll.length) {
    lines.push('(none)')
  } else {
    for (const e of errorAll) {
      const kind = e.type === 'unhandledrejection' ? 'UnhandledRejection' : 'Error'
      lines.push(`[${formatTime(e.timestamp)}] ${kind}: ${e.message}`)
      if (e.source) lines.push(`  at ${e.source}:${e.line}:${e.col}`)
      if (e.stack) {
        const frames = e.stack.split('\n').slice(1, 7).map((l) => l.trim()).filter(Boolean)
        for (const f of frames) lines.push(`  ${f}`)
      }
    }
  }
  lines.push('')

  lines.push(`## Storage`)
  lines.push(storageSection())
  lines.push('')

  lines.push(`## Page Timing`)
  lines.push(timingSection())

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Screenshot capture via Screen Capture API
// ---------------------------------------------------------------------------

async function captureScreenViaMedia(): Promise<Blob | null> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: 'browser' } as MediaTrackConstraints,
    // Non-standard Chrome flag — pre-selects current tab in the picker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(({ preferCurrentTab: true }) as Record<string, unknown>),
  } as DisplayMediaStreamOptions)

  const video = document.createElement('video')
  video.srcObject = stream
  video.muted = true

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      video.play().then(resolve).catch(resolve)
    }
  })

  // Small delay for first frame to render
  await new Promise((r) => setTimeout(r, 120))

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || window.innerWidth
  canvas.height = video.videoHeight || window.innerHeight
  const ctx = canvas.getContext('2d')

  let blob: Blob | null = null
  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
  }

  stream.getTracks().forEach((t) => t.stop())
  video.srcObject = null

  return blob
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const container: Record<string, string> = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  boxSizing: 'border-box',
}

const tabBar: Record<string, string> = {
  display: 'flex',
  flexShrink: '0',
  borderBottom: `1px solid ${COLORS.panelBorder}`,
}

function tabBtn(active: boolean): Record<string, string> {
  return {
    flex: '1',
    padding: '7px 4px',
    border: 'none',
    borderBottom: active ? `2px solid ${COLORS.fabBg}` : '2px solid transparent',
    backgroundColor: 'transparent',
    color: active ? COLORS.textBright : COLORS.textMuted,
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'color 0.1s',
    boxSizing: 'border-box',
  }
}

const body: Record<string, string> = {
  flex: '1',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  boxSizing: 'border-box',
}

const label: Record<string, string> = {
  fontSize: '10px',
  fontWeight: '600',
  color: COLORS.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  marginBottom: '4px',
  display: 'block',
}

const summaryRow: Record<string, string> = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '4px',
}

function summaryCard(count: number, accentColor: string): Record<string, string> {
  return {
    padding: '6px',
    borderRadius: '4px',
    backgroundColor: count > 0 ? `${accentColor}22` : COLORS.toolBtnBg,
    border: `1px solid ${count > 0 ? accentColor : COLORS.panelBorder}`,
    textAlign: 'center',
  }
}

const summaryCount: Record<string, string> = {
  fontSize: '16px',
  fontWeight: '700',
  color: COLORS.textBright,
  display: 'block',
}

const summaryLabel: Record<string, string> = {
  fontSize: '9px',
  color: COLORS.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
}

const screenshotZone: Record<string, string> = {
  border: `1px dashed ${COLORS.panelBorder}`,
  borderRadius: '6px',
  padding: '10px',
  minHeight: '64px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const screenshotGrid: Record<string, string> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
}

const screenshotThumb: Record<string, string> = {
  position: 'relative',
  width: '56px',
  height: '40px',
  borderRadius: '3px',
  overflow: 'hidden',
  flexShrink: '0',
  border: `1px solid ${COLORS.panelBorder}`,
  cursor: 'default',
}

const thumbImg: Record<string, string> = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const thumbRemove: Record<string, string> = {
  position: 'absolute',
  top: '1px',
  right: '1px',
  width: '14px',
  height: '14px',
  borderRadius: '2px',
  border: 'none',
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: '#fff',
  fontSize: '9px',
  lineHeight: '1',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0',
}

const zoneHint: Record<string, string> = {
  fontSize: '11px',
  color: COLORS.textMuted,
  textAlign: 'center',
}

const btnRow: Record<string, string> = {
  display: 'flex',
  gap: '4px',
}

function smallBtn(variant: 'muted' | 'danger' | 'primary' = 'muted'): Record<string, string> {
  const bg =
    variant === 'primary'
      ? COLORS.fabBg
      : variant === 'danger'
        ? '#7f1d1d'
        : COLORS.toolBtnBg
  const col =
    variant === 'primary' ? '#fff' : variant === 'danger' ? '#fca5a5' : COLORS.textMuted
  return {
    flex: '1',
    padding: '5px 8px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: bg,
    color: col,
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }
}

const bigBtn = (disabled: boolean): Record<string, string> => ({
  width: '100%',
  padding: '9px 12px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: disabled ? '#1e293b' : COLORS.fabBg,
  color: disabled ? COLORS.textMuted : '#fff',
  fontSize: '12px',
  fontWeight: '600',
  cursor: disabled ? 'not-allowed' : 'pointer',
})

const filterToggle = (active: boolean): Record<string, string> => ({
  padding: '3px 8px',
  borderRadius: '4px',
  border: `1px solid ${active ? COLORS.fabBg : COLORS.panelBorder}`,
  backgroundColor: active ? `${COLORS.fabBg}33` : 'transparent',
  color: active ? '#93c5fd' : COLORS.textMuted,
  fontSize: '10px',
  cursor: 'pointer',
  fontWeight: '500',
})

const historyItem: Record<string, string> = {
  borderRadius: '6px',
  border: `1px solid ${COLORS.panelBorder}`,
  backgroundColor: COLORS.toolBtnBg,
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const historyUrl: Record<string, string> = {
  fontSize: '10px',
  color: COLORS.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const historyMeta: Record<string, string> = {
  fontSize: '10px',
  color: COLORS.textMuted,
}

const emptyHistory: Record<string, string> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: COLORS.textMuted,
  fontSize: '12px',
  padding: '20px',
  textAlign: 'center',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DebugSnapshot() {
  const [tab, setTab] = useState<'capture' | 'history'>('capture')
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [saved, setSaved] = useState<SavedSnapshot[]>(loadSaved)
  const [isCapturing, setIsCapturing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [errorsOnly, setErrorsOnly] = useState(true)

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      for (const s of screenshots) URL.revokeObjectURL(s.url)
    }
  }, [])  // intentionally only on unmount

  // Global paste listener — captures images pasted anywhere on the page
  useEffect(() => {
    if (tab !== 'capture') return

    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile()
          if (blob) appendScreenshot(blob)
        }
      }
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [tab])

  function appendScreenshot(blob: Blob) {
    const id = screenshotSeq++
    const url = URL.createObjectURL(blob)
    setScreenshots((prev) => [...prev, { id, url, blob, name: `screenshot-${id}.png` }])
  }

  const handleCapture = useCallback(async () => {
    setIsCapturing(true)
    try {
      const blob = await captureScreenViaMedia()
      if (blob) appendScreenshot(blob)
    } catch {
      // User cancelled or API not supported — silent fail
    }
    setIsCapturing(false)
  }, [])

  const removeShot = useCallback((id: number) => {
    setScreenshots((prev) => {
      const hit = prev.find((s) => s.id === id)
      if (hit) URL.revokeObjectURL(hit.url)
      return prev.filter((s) => s.id !== id)
    })
  }, [])

  const clearShots = useCallback(() => {
    setScreenshots((prev) => {
      for (const s of prev) URL.revokeObjectURL(s.url)
      return []
    })
  }, [])

  const downloadShots = useCallback((shots: Screenshot[]) => {
    for (const s of shots) {
      const a = document.createElement('a')
      a.href = s.url
      a.download = s.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }, [])

  const markCopied = useCallback((id: string) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleCopyReport = useCallback(async () => {
    const report = buildReport(screenshots, errorsOnly)

    if (screenshots.length > 0) downloadShots(screenshots)

    const snap: SavedSnapshot = {
      id: String(Date.now()),
      timestamp: Date.now(),
      pageUrl: window.location.href,
      report,
    }

    setSaved((prev) => {
      const next = [snap, ...prev].slice(0, MAX_SAVED)
      persistSaved(next)
      return next
    })

    await navigator.clipboard.writeText(report)
    markCopied(snap.id)
  }, [screenshots, errorsOnly, downloadShots, markCopied])

  const copyHistoryItem = useCallback(async (snap: SavedSnapshot) => {
    await navigator.clipboard.writeText(snap.report)
    markCopied(snap.id)
  }, [markCopied])

  const deleteHistoryItem = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.filter((s) => s.id !== id)
      persistSaved(next)
      return next
    })
  }, [])

  // Live counts from interceptors
  const consoleAll = getConsoleEntries()
  const networkAll = getNetworkEntries()
  const errorAll = getErrorEntries()
  const consoleErrors = consoleAll.filter((e) => e.level === 'error' || e.level === 'warn').length
  const networkErrors = networkAll.filter((e) => e.status === 0 || e.status >= 400).length

  return h(
    'div',
    { style: container },

    // Tab bar
    h(
      'div',
      { style: tabBar },
      h('button', { style: tabBtn(tab === 'capture'), onClick: () => setTab('capture') }, 'Capture'),
      h('button', { style: tabBtn(tab === 'history'), onClick: () => setTab('history') }, `History (${saved.length})`)
    ),

    tab === 'capture'
      ? h(
          'div',
          { style: body },

          // Filter row
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
            h('span', { style: label }, 'Report data'),
            h(
              'button',
              { style: filterToggle(errorsOnly), onClick: () => setErrorsOnly((v) => !v) },
              errorsOnly ? 'Errors only' : 'All entries'
            )
          ),

          // Summary counts
          h(
            'div',
            { style: summaryRow },
            h(
              'div',
              { style: summaryCard(consoleErrors, '#eab308') },
              h('span', { style: summaryCount }, String(consoleErrors)),
              h('span', { style: summaryLabel }, 'Console')
            ),
            h(
              'div',
              { style: summaryCard(networkErrors, '#ef4444') },
              h('span', { style: summaryCount }, String(networkErrors)),
              h('span', { style: summaryLabel }, 'Net Errors')
            ),
            h(
              'div',
              { style: summaryCard(errorAll.length, '#ef4444') },
              h('span', { style: summaryCount }, String(errorAll.length)),
              h('span', { style: summaryLabel }, 'JS Errors')
            )
          ),

          // Screenshot zone
          h(
            'div',
            null,
            h('span', { style: label }, `Screenshots (${screenshots.length})`),
            h(
              'div',
              { style: screenshotZone },
              screenshots.length === 0
                ? h(
                    'div',
                    { style: zoneHint },
                    'Cmd+V to paste a screenshot',
                    h('br', null),
                    'or click Capture below'
                  )
                : h(
                    'div',
                    { style: screenshotGrid },
                    screenshots.map((s) =>
                      h(
                        'div',
                        { key: s.id, style: screenshotThumb, title: s.name },
                        h('img', { src: s.url, style: thumbImg, alt: s.name }),
                        h(
                          'button',
                          { style: thumbRemove, onClick: () => removeShot(s.id), title: 'Remove' },
                          '\u00D7'
                        )
                      )
                    )
                  ),
              h(
                'div',
                { style: btnRow },
                h(
                  'button',
                  {
                    style: smallBtn('muted'),
                    onClick: handleCapture,
                    disabled: isCapturing,
                    title: 'Capture current screen (opens share dialog)',
                  },
                  isCapturing ? 'Capturing...' : 'Capture Screen'
                ),
                screenshots.length > 0
                  ? h('button', { style: smallBtn('danger'), onClick: clearShots, title: 'Delete all screenshots' }, 'Delete All')
                  : null
              )
            )
          ),

          // Primary action
          h(
            'button',
            {
              style: bigBtn(false),
              onClick: handleCopyReport,
              title: 'Copy debug report to clipboard. Screenshots (if any) download as files.',
            },
            copiedId ? 'Copied!' : 'Copy Report & Download Screenshots'
          ),

          h(
            'div',
            { style: { fontSize: '10px', color: COLORS.textMuted, lineHeight: '1.4' } },
            'Copies a full markdown report. Screenshots download to your Downloads folder as numbered PNG files. Report saved to History for re-copying.'
          )
        )
      : // History tab
        h(
          'div',
          { style: { ...body, gap: '6px' } },
          saved.length === 0
            ? h('div', { style: emptyHistory }, 'No snapshots yet. Copy a report from the Capture tab to save it here.')
            : saved.map((snap) => {
                const d = new Date(snap.timestamp)
                const dateStr = `${d.toLocaleDateString()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
                const isCopied = copiedId === snap.id
                return h(
                  'div',
                  { key: snap.id, style: historyItem },
                  h('div', { style: historyMeta }, dateStr),
                  h('div', { style: historyUrl, title: snap.pageUrl }, snap.pageUrl),
                  h(
                    'div',
                    { style: btnRow },
                    h(
                      'button',
                      {
                        style: smallBtn(isCopied ? 'primary' : 'muted'),
                        onClick: () => copyHistoryItem(snap),
                      },
                      isCopied ? 'Copied!' : 'Copy Report'
                    ),
                    h(
                      'button',
                      { style: smallBtn('danger'), onClick: () => deleteHistoryItem(snap.id) },
                      'Delete'
                    )
                  )
                )
              })
        )
  )
}
