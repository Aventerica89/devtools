'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Plus,
  Trash2,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Variable,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type HeaderEntry = {
  key: string
  value: string
}

export type EnvVar = {
  key: string
  value: string
}

export type RequestConfig = {
  method: string
  url: string
  headers: HeaderEntry[]
  body: string
}

export type SavedRequest = {
  id: number
  projectId: string | null
  name: string
  method: string
  url: string
  headers: string | null
  body: string | null
  createdAt: string | null
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  POST: 'bg-blue-900/50 text-blue-300 border-blue-700',
  PUT: 'bg-amber-900/50 text-amber-300 border-amber-700',
  DELETE: 'bg-red-900/50 text-red-300 border-red-700',
  PATCH: 'bg-purple-900/50 text-purple-300 border-purple-700',
}

const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH']

type Props = {
  onSend: (config: RequestConfig) => void
  isLoading: boolean
  savedRequests: SavedRequest[]
  onLoadRequest: (req: SavedRequest) => void
  onSaveRequest: (name: string, config: RequestConfig) => void
  onDeleteRequest: (id: number) => void
}

export function RequestBuilder({
  onSend,
  isLoading,
  savedRequests,
  onLoadRequest,
  onSaveRequest,
  onDeleteRequest,
}: Props) {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<HeaderEntry[]>([])
  const [body, setBody] = useState('')
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [showEnvVars, setShowEnvVars] = useState(false)
  const [envVars, setEnvVars] = useState<EnvVar[]>([])

  function handleSend() {
    if (!url) return
    onSend({
      method,
      url: interpolate(url, envVars),
      headers: headers
        .filter((h) => h.key.trim())
        .map((h) => ({
          key: h.key,
          value: interpolate(h.value, envVars),
        })),
      body: METHODS_WITH_BODY.includes(method)
        ? interpolate(body, envVars)
        : '',
    })
  }

  function handleSave() {
    if (!saveName.trim() || !url) return
    onSaveRequest(saveName.trim(), { method, url, headers, body })
    setSaveName('')
    setShowSaveInput(false)
  }

  function loadRequest(req: SavedRequest) {
    setMethod(req.method)
    setUrl(req.url)
    setHeaders(
      req.headers ? JSON.parse(req.headers) : []
    )
    setBody(req.body || '')
    onLoadRequest(req)
  }

  function addHeader() {
    setHeaders([...headers, { key: '', value: '' }])
  }

  function updateHeader(
    index: number,
    field: 'key' | 'value',
    val: string
  ) {
    setHeaders(
      headers.map((h, i) =>
        i === index ? { ...h, [field]: val } : h
      )
    )
  }

  function removeHeader(index: number) {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  function addEnvVar() {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  function updateEnvVar(
    index: number,
    field: 'key' | 'value',
    val: string
  ) {
    setEnvVars(
      envVars.map((v, i) =>
        i === index ? { ...v, [field]: val } : v
      )
    )
  }

  function removeEnvVar(index: number) {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Method + URL */}
      <div className="flex gap-2">
        <div className="flex rounded-md border border-border overflow-hidden shrink-0">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn(
                'px-2.5 py-1.5 text-xs font-medium transition-colors',
                method === m
                  ? METHOD_COLORS[m]
                  : 'bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="bg-background border-border font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !url}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send
        </Button>
      </div>

      {/* Headers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Headers</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addHeader}
            className="h-6 text-xs text-muted-foreground"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
        {headers.map((h, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={h.key}
              onChange={(e) => updateHeader(i, 'key', e.target.value)}
              placeholder="Header name"
              className="bg-background border-border text-xs flex-1"
            />
            <Input
              value={h.value}
              onChange={(e) => updateHeader(i, 'value', e.target.value)}
              placeholder="Value"
              className="bg-background border-border text-xs flex-1"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => removeHeader(i)}
              className="text-muted-foreground hover:text-red-400 shrink-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Body (only for POST/PUT/PATCH) */}
      {METHODS_WITH_BODY.includes(method) && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Request Body (JSON)
          </Label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{ "key": "value" }'
            rows={6}
            className={cn(
              'w-full rounded-md border border-border',
              'bg-background text-foreground text-sm p-3 font-mono',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'resize-none'
            )}
          />
        </div>
      )}

      {/* Environment Variables */}
      <div className="space-y-2">
        <button
          onClick={() => setShowEnvVars(!showEnvVars)}
          className={cn(
            'flex items-center gap-1 text-xs text-muted-foreground',
            'hover:text-foreground transition-colors'
          )}
        >
          <Variable className="h-3 w-3" />
          Environment Variables
          {showEnvVars ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {envVars.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] ml-1"
            >
              {envVars.length}
            </Badge>
          )}
        </button>
        {showEnvVars && (
          <div className="space-y-2 pl-4 border-l border-border">
            <p className="text-[10px] text-muted-foreground">
              {'Use {{KEY}} in URL, headers, or body'}
            </p>
            {envVars.map((v, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={v.key}
                  onChange={(e) =>
                    updateEnvVar(i, 'key', e.target.value)
                  }
                  placeholder="VAR_NAME"
                  className="bg-background border-border text-xs flex-1"
                />
                <Input
                  value={v.value}
                  onChange={(e) =>
                    updateEnvVar(i, 'value', e.target.value)
                  }
                  placeholder="value"
                  className="bg-background border-border text-xs flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeEnvVar(i)}
                  className="text-muted-foreground hover:text-red-400 shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={addEnvVar}
              className="h-6 text-xs text-muted-foreground"
            >
              <Plus className="h-3 w-3" />
              Add Variable
            </Button>
          </div>
        )}
      </div>

      {/* Save / Load */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          {showSaveInput ? (
            <>
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Request name"
                className="bg-background border-border text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!saveName.trim() || !url}
                className="shrink-0 text-xs"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveInput(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveInput(true)}
              className="text-xs"
              disabled={!url}
            >
              <Save className="h-3 w-3" />
              Save Request
            </Button>
          )}
        </div>

        {savedRequests.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Saved Requests
            </Label>
            {savedRequests.map((req) => (
              <div
                key={req.id}
                className={cn(
                  'flex items-center justify-between gap-2',
                  'rounded-md border border-border px-3 py-1.5',
                  'hover:border-ring transition-colors cursor-pointer'
                )}
                onClick={() => loadRequest(req)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    className={cn(
                      'text-[10px] shrink-0',
                      METHOD_COLORS[req.method]
                    )}
                  >
                    {req.method}
                  </Badge>
                  <span className="text-xs text-foreground truncate">
                    {req.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {req.url}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteRequest(req.id)
                  }}
                  className="text-muted-foreground hover:text-red-400 shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function interpolate(text: string, vars: EnvVar[]): string {
  return vars.reduce((result, v) => {
    if (!v.key.trim()) return result
    const pattern = `{{${v.key}}}`
    return result.split(pattern).join(v.value)
  }, text)
}
