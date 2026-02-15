'use client'

import { useState, useMemo, useCallback, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { COMMON_PATTERNS } from './patterns'
import {
  Regex,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  Trash2,
} from 'lucide-react'

type FlagKey = 'g' | 'i' | 'm' | 's'
const FLAG_LABELS: Record<FlagKey, string> = {
  g: 'global',
  i: 'case-insensitive',
  m: 'multiline',
  s: 'dotAll',
}

type MatchResult = {
  value: string
  index: number
  groups: Record<string, string> | null
  captures: readonly string[]
}

function buildRegex(
  pattern: string,
  flags: Record<FlagKey, boolean>
): { regex: RegExp | null; error: string | null } {
  if (!pattern) return { regex: null, error: null }
  const flagStr = (Object.keys(flags) as FlagKey[])
    .filter((f) => flags[f])
    .join('')
  try {
    return { regex: new RegExp(pattern, flagStr), error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid regex'
    return { regex: null, error: msg }
  }
}

function getMatches(regex: RegExp, text: string): readonly MatchResult[] {
  const results: MatchResult[] = []
  if (!regex.global) {
    const m = regex.exec(text)
    if (m) {
      results.push({
        value: m[0],
        index: m.index,
        groups: m.groups ? { ...m.groups } : null,
        captures: m.slice(1),
      })
    }
    return results
  }
  let m: RegExpExecArray | null
  let safety = 0
  regex.lastIndex = 0
  while ((m = regex.exec(text)) !== null && safety < 5000) {
    results.push({
      value: m[0],
      index: m.index,
      groups: m.groups ? { ...m.groups } : null,
      captures: m.slice(1),
    })
    if (m[0].length === 0) regex.lastIndex++
    safety++
  }
  return results
}

function buildHighlightedText(
  text: string,
  matches: readonly MatchResult[]
): ReactNode[] {
  if (matches.length === 0) return [text]
  const parts: ReactNode[] = []
  let cursor = 0
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    if (m.index > cursor) {
      parts.push(text.slice(cursor, m.index))
    }
    parts.push(
      <mark
        key={`m-${i}`}
        className="bg-amber-500/30 text-amber-200 rounded-sm px-0.5"
      >
        {m.value}
      </mark>
    )
    cursor = m.index + m.value.length
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }
  return parts
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
  })
  const [testString, setTestString] = useState('')
  const [copied, setCopied] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)

  const toggleFlag = useCallback((flag: FlagKey) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }))
  }, [])

  const { regex, error } = useMemo(
    () => buildRegex(pattern, flags),
    [pattern, flags]
  )

  const matches = useMemo(() => {
    if (!regex || !testString) return [] as readonly MatchResult[]
    return getMatches(regex, testString)
  }, [regex, testString])

  const highlightedParts = useMemo(
    () => buildHighlightedText(testString, matches),
    [testString, matches]
  )

  const flagStr = (Object.keys(flags) as FlagKey[])
    .filter((f) => flags[f])
    .join('')

  const handleCopy = useCallback(() => {
    if (!pattern) return
    navigator.clipboard.writeText(`/${pattern}/${flagStr}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [pattern, flagStr])

  const handleClear = useCallback(() => {
    setPattern('')
    setTestString('')
    setFlags({ g: true, i: false, m: false, s: false })
  }, [])

  const handleSelectPreset = useCallback((idx: number) => {
    const preset = COMMON_PATTERNS[idx]
    setPattern(preset.pattern)
    const newFlags: Record<FlagKey, boolean> = { g: false, i: false, m: false, s: false }
    for (const c of preset.flags) {
      if (c in newFlags) newFlags[c as FlagKey] = true
    }
    setFlags(newFlags)
    setPresetOpen(false)
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Regex className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">Regex Tester</h1>
          {matches.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Pattern + Flags */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Pattern
          </span>
          <div className="flex items-center gap-2">
            {/* Preset selector */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPresetOpen(!presetOpen)}
                className="text-xs text-muted-foreground hover:text-foreground h-7"
              >
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Presets
              </Button>
              {presetOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPresetOpen(false)}
                  />
                  <div className="absolute right-0 top-8 z-50 w-52 rounded-md border border-border bg-card shadow-lg py-1">
                    {COMMON_PATTERNS.map((p, idx) => (
                      <button
                        key={p.label}
                        onClick={() => handleSelectPreset(idx)}
                        className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent hover:text-foreground"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!pattern && !testString}
              className="text-xs text-muted-foreground hover:text-foreground h-7"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Pattern input row */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-sm">/</span>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regex pattern..."
            className={cn(
              'flex-1 font-mono bg-background border-border text-sm',
              error && 'border-red-700'
            )}
          />
          <span className="text-muted-foreground font-mono text-sm">
            /{flagStr}
          </span>
        </div>

        {/* Flags */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Flags:</span>
          {(Object.keys(FLAG_LABELS) as FlagKey[]).map((flag) => (
            <button
              key={flag}
              onClick={() => toggleFlag(flag)}
              title={FLAG_LABELS[flag]}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-mono transition-colors border',
                flags[flag]
                  ? 'bg-blue-600/30 border-blue-600 text-blue-300'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {flag}
            </button>
          ))}

          <div className="h-4 w-px bg-accent mx-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!pattern}
            className="text-xs h-7"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-950/50 border border-red-900">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Test string */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          Test String
        </span>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter text to test against the pattern..."
          rows={6}
          className={cn(
            'w-full rounded-md border border-border',
            'bg-background text-foreground text-sm p-3 font-mono',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'resize-y'
          )}
        />
      </div>

      {/* Results */}
      {testString && pattern && !error && (
        <div className="space-y-4">
          {/* Highlighted text */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Highlighted Matches
            </span>
            <ScrollArea className="max-h-48">
              <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-all">
                {highlightedParts}
              </pre>
            </ScrollArea>
          </div>

          {/* Match list */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                Match Details
              </span>
              {matches.length === 0 && (
                <span className="text-xs text-muted-foreground">No matches</span>
              )}
            </div>
            {matches.length > 0 && (
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {matches.map((m, idx) => (
                    <div
                      key={`match-${idx}`}
                      className="rounded-md border border-border bg-background p-3 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">#{idx + 1}</Badge>
                        <span className="font-mono text-sm text-amber-300">{m.value}</span>
                        <span className="text-xs text-muted-foreground ml-auto">index {m.index}</span>
                      </div>
                      {m.captures.length > 0 && (
                        <div className="pl-2 space-y-0.5">
                          {m.captures.map((cap, ci) => (
                            <div key={`cap-${ci}`} className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Group {ci + 1}:</span>
                              <span className="font-mono text-foreground">{cap ?? '(undefined)'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {m.groups && Object.keys(m.groups).length > 0 && (
                        <div className="pl-2 space-y-0.5">
                          {Object.entries(m.groups).map(([name, val]) => (
                            <div key={name} className="flex items-center gap-2 text-xs">
                              <span className="text-blue-400">{name}:</span>
                              <span className="font-mono text-foreground">{val ?? '(undefined)'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!pattern && !testString && (
        <div className="text-center py-16 text-muted-foreground">
          <Regex className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Enter a pattern and test string above</p>
          <p className="text-xs mt-1">
            Or pick a preset from the dropdown to get started
          </p>
        </div>
      )}
    </div>
  )
}
