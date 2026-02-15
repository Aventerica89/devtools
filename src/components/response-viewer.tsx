'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ResponseData = {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  timing: number
}

type Props = {
  response: ResponseData | null
  isLoading: boolean
}

function getStatusColor(status: number): string {
  if (status === 0) return 'bg-accent text-foreground'
  if (status < 300) return 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
  if (status < 400) return 'bg-blue-900/50 text-blue-300 border-blue-700'
  if (status < 500) return 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
  return 'bg-red-900/50 text-red-300 border-red-700'
}

function formatBody(body: string): string {
  try {
    const parsed = JSON.parse(body)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return body
  }
}

export function ResponseViewer({ response, isLoading }: Props) {
  const [showHeaders, setShowHeaders] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copyBody() {
    if (!response) return
    await navigator.clipboard.writeText(response.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Sending request...</p>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">Send a request to see the response</p>
        <p className="text-xs mt-1 text-muted-foreground">
          Build your request on the left and hit Send
        </p>
      </div>
    )
  }

  const formattedBody = formatBody(response.body)
  const headerEntries = Object.entries(response.headers)

  return (
    <div className="space-y-4">
      {/* Status + Timing */}
      <div className="flex items-center gap-3">
        <Badge className={cn('text-sm font-mono', getStatusColor(response.status))}>
          {response.status} {response.statusText}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {response.timing}ms
        </div>
      </div>

      {/* Response Headers (collapsible) */}
      {headerEntries.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowHeaders(!showHeaders)}
            className={cn(
              'flex items-center gap-1 text-xs text-muted-foreground',
              'hover:text-foreground transition-colors'
            )}
          >
            Response Headers
            {showHeaders ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            <Badge variant="secondary" className="text-[10px] ml-1">
              {headerEntries.length}
            </Badge>
          </button>
          {showHeaders && (
            <div
              className={cn(
                'rounded-md border border-border',
                'bg-background p-3 space-y-1'
              )}
            >
              {headerEntries.map(([key, value]) => (
                <div key={key} className="flex gap-2 text-xs">
                  <span className="text-muted-foreground shrink-0 font-mono">
                    {key}:
                  </span>
                  <span className="text-foreground font-mono break-all">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Response Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Response Body
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyBody}
            className="h-6 text-xs text-muted-foreground"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <pre
          className={cn(
            'rounded-md border border-border',
            'bg-background p-3 text-xs font-mono',
            'text-foreground overflow-auto max-h-[500px]',
            'whitespace-pre-wrap break-all'
          )}
        >
          {formattedBody}
        </pre>
      </div>
    </div>
  )
}
