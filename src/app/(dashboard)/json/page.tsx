'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { JsonTree } from '@/components/json-tree'
import { type JsonValue } from '@/components/json-tree-node'
import { cn } from '@/lib/utils'
import {
  Braces,
  WrapText,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Clipboard,
} from 'lucide-react'

type ParseError = {
  message: string
  line: number | null
  column: number | null
}

function getParseError(raw: string): ParseError {
  try {
    JSON.parse(raw)
    return { message: '', line: null, column: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown parse error'
    const posMatch = msg.match(/position\s+(\d+)/i)
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10)
      const before = raw.slice(0, pos)
      const line = before.split('\n').length
      const lastNewline = before.lastIndexOf('\n')
      const column = pos - lastNewline
      return { message: msg, line, column }
    }
    return { message: msg, line: null, column: null }
  }
}

export default function JsonViewerPage() {
  const [rawInput, setRawInput] = useState('')
  const [parsed, setParsed] = useState<unknown>(null)
  const [parseError, setParseError] = useState<ParseError | null>(null)
  const [mode, setMode] = useState<'tree' | 'formatted' | 'minified'>('tree')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandAll, setExpandAll] = useState(false)
  const [copiedOutput, setCopiedOutput] = useState(false)
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const handleParse = useCallback(() => {
    const trimmed = rawInput.trim()
    if (!trimmed) {
      setParsed(null)
      setParseError(null)
      return
    }

    const error = getParseError(trimmed)
    if (error.message) {
      setParseError(error)
      setParsed(null)
      return
    }

    setParsed(JSON.parse(trimmed))
    setParseError(null)
  }, [rawInput])

  const handleFormat = useCallback(() => {
    if (parsed !== null && parsed !== undefined) {
      setRawInput(JSON.stringify(parsed, null, 2))
      setMode('formatted')
    }
  }, [parsed])

  const handleMinify = useCallback(() => {
    if (parsed !== null && parsed !== undefined) {
      setRawInput(JSON.stringify(parsed))
      setMode('minified')
    }
  }, [parsed])

  const handleClear = useCallback(() => {
    setRawInput('')
    setParsed(null)
    setParseError(null)
    setSearchTerm('')
    setExpandAll(false)
  }, [])

  const handleCopyOutput = useCallback(() => {
    if (parsed === null && parsed === undefined) return
    const text = mode === 'minified'
      ? JSON.stringify(parsed)
      : JSON.stringify(parsed, null, 2)
    navigator.clipboard.writeText(text)
    setCopiedOutput(true)
    setTimeout(() => setCopiedOutput(false), 1500)
  }, [parsed, mode])

  const handlePathCopy = useCallback((path: string) => {
    setCopiedPath(path)
    setTimeout(() => setCopiedPath(null), 2000)
  }, [])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRawInput(text)
    } catch {
      // Clipboard access denied
    }
  }, [])

  const formattedOutput = parsed !== null && parsed !== undefined
    ? (mode === 'minified'
      ? JSON.stringify(parsed)
      : JSON.stringify(parsed, null, 2))
    : ''

  const lineCount = formattedOutput
    ? formattedOutput.split('\n').length
    : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Braces className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">JSON Viewer</h1>
          {parsed !== null && parsed !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {lineCount} lines
            </Badge>
          )}
        </div>

        {copiedPath && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Check className="h-3 w-3" />
            <span className="font-mono">{copiedPath}</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Input
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              className="text-xs text-muted-foreground hover:text-foreground h-7"
            >
              <Clipboard className="h-3.5 w-3.5 mr-1" />
              Paste
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!rawInput}
              className="text-xs text-muted-foreground hover:text-foreground h-7"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder='Paste JSON here, e.g. {"name": "value"}'
          rows={8}
          className={cn(
            'w-full rounded-md border border-border',
            'bg-background text-foreground text-sm p-3 font-mono',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'resize-y',
            parseError && 'border-red-700'
          )}
        />

        {/* Error display */}
        {parseError && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-950/50 border border-red-900">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-red-300">{parseError.message}</p>
              {parseError.line !== null && (
                <p className="text-red-400/70 text-xs mt-1">
                  Line {parseError.line}
                  {parseError.column !== null && `, Column ${parseError.column}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleParse} disabled={!rawInput.trim()}>
            <Braces className="h-4 w-4 mr-1" />
            Parse
          </Button>

          <div className="h-4 w-px bg-accent" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleFormat}
            disabled={parsed === null && parsed === undefined}
            className={cn(
              'text-xs',
              mode === 'formatted' && 'border-blue-700 text-blue-300'
            )}
          >
            <WrapText className="h-3.5 w-3.5 mr-1" />
            Format
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMinify}
            disabled={parsed === null && parsed === undefined}
            className={cn(
              'text-xs',
              mode === 'minified' && 'border-blue-700 text-blue-300'
            )}
          >
            <Minimize2 className="h-3.5 w-3.5 mr-1" />
            Minify
          </Button>

          <div className="h-4 w-px bg-accent" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyOutput}
            disabled={parsed === null && parsed === undefined}
            className="text-xs"
          >
            {copiedOutput ? (
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
      </div>

      {/* Output area (only shown when parsed) */}
      {parsed !== null && parsed !== undefined && (
        <>
          {/* Search + controls */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search keys and values..."
                className="pl-8 h-8 bg-card border-border text-sm"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandAll(!expandAll)}
              className="text-xs"
            >
              {expandAll ? (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                  Expand All
                </>
              )}
            </Button>

            <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
              <button
                onClick={() => setMode('tree')}
                className={cn(
                  'px-2 py-1 rounded text-xs transition-colors',
                  mode === 'tree'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Tree
              </button>
              <button
                onClick={() => setMode('formatted')}
                className={cn(
                  'px-2 py-1 rounded text-xs transition-colors',
                  mode === 'formatted'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Raw
              </button>
            </div>
          </div>

          {/* Tree view or raw output */}
          <div className="rounded-lg border border-border bg-card">
            <ScrollArea className="h-[400px]">
              <div className="p-4">
                {mode === 'tree' ? (
                  <JsonTree
                    data={parsed as JsonValue}
                    searchTerm={searchTerm}
                    expandAll={expandAll}
                    onPathCopy={handlePathCopy}
                  />
                ) : (
                  <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-all">
                    {formattedOutput}
                  </pre>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {/* Empty state */}
      {parsed === null && !parseError && !rawInput.trim() && (
        <div className="text-center py-16 text-muted-foreground">
          <Braces className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Paste JSON above and click Parse</p>
          <p className="text-xs mt-1">
            Supports objects, arrays, and nested structures
          </p>
        </div>
      )}
    </div>
  )
}
