'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  Save,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TestResult = {
  status: 'idle' | 'testing' | 'success' | 'error'
  message: string
}

type SaveResult = {
  status: 'idle' | 'saving' | 'saved' | 'error'
  message: string
}

type AiProviderCardProps = {
  readonly name: string
  readonly provider: string
  readonly envVar: string
  readonly isConfigured: boolean
  readonly models: ReadonlyArray<string>
  readonly onKeyChanged?: () => void
}

export function AiProviderCard({
  name,
  provider,
  envVar,
  isConfigured,
  models,
  onKeyChanged,
}: AiProviderCardProps) {
  const [showKey, setShowKey] = useState(false)
  const [keyValue, setKeyValue] = useState('')
  const [testResult, setTestResult] = useState<TestResult>({
    status: 'idle',
    message: '',
  })
  const [saveResult, setSaveResult] = useState<SaveResult>({
    status: 'idle',
    message: '',
  })

  async function handleSaveKey() {
    if (!keyValue.trim()) return

    setSaveResult({ status: 'saving', message: 'Saving...' })

    try {
      const res = await fetch('/api/ai/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: keyValue }),
      })

      if (res.ok) {
        setSaveResult({ status: 'saved', message: 'Key saved' })
        setKeyValue('')
        onKeyChanged?.()
      } else {
        const data = await res.json()
        setSaveResult({
          status: 'error',
          message: data.error || 'Save failed',
        })
      }
    } catch {
      setSaveResult({ status: 'error', message: 'Network error' })
    }
  }

  async function handleDeleteKey() {
    try {
      await fetch('/api/ai/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      onKeyChanged?.()
    } catch {
      // ignore
    }
  }

  async function handleTestConnection() {
    setTestResult({ status: 'testing', message: 'Testing connection...' })

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const data = await res.json()

      if (data.success) {
        setTestResult({
          status: 'success',
          message: 'Connection successful',
        })
      } else {
        setTestResult({
          status: 'error',
          message: data.error || 'Connection failed',
        })
      }
    } catch {
      setTestResult({
        status: 'error',
        message: 'Network error',
      })
    }
  }

  return (
    <div className="border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium text-foreground">{name}</h3>
            <p className="text-xs text-muted-foreground">{envVar}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            'text-xs',
            isConfigured
              ? 'bg-green-900/50 text-green-300 border-green-800'
              : 'bg-red-900/50 text-red-300 border-red-800'
          )}
        >
          {isConfigured ? 'Configured' : 'Not Set'}
        </Badge>
      </div>

      {/* Key input */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {provider === 'anthropic' ? 'Claude Token (API key or OAuth token)' : 'API Key'}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type={showKey ? 'text' : 'password'}
            value={keyValue}
            onChange={(e) => {
              setKeyValue(e.target.value)
              setSaveResult({ status: 'idle', message: '' })
            }}
            placeholder={
              isConfigured
                ? 'Token configured — enter new token to replace'
                : provider === 'anthropic'
                  ? 'Paste sk-ant-api... or sk-ant-oat... token'
                  : 'Paste your API key'
            }
            className="bg-background border-border font-mono text-xs"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? 'Hide' : 'Reveal'}
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSaveKey}
            disabled={!keyValue.trim() || saveResult.status === 'saving'}
          >
            {saveResult.status === 'saving' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save Key
          </Button>

          {isConfigured && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300"
              onClick={handleDeleteKey}
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </Button>
          )}

          {saveResult.status === 'saved' && (
            <span className="text-green-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {saveResult.message}
            </span>
          )}
          {saveResult.status === 'error' && (
            <span className="text-red-400 text-xs flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              {saveResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Available models */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Available Models</Label>
        <div className="flex flex-wrap gap-1.5">
          {models.map((model) => (
            <Badge
              key={model}
              variant="secondary"
              className="text-xs bg-muted text-foreground"
            >
              {model}
            </Badge>
          ))}
        </div>
      </div>

      {/* Test connection */}
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="outline"
          onClick={handleTestConnection}
          disabled={!isConfigured || testResult.status === 'testing'}
        >
          {testResult.status === 'testing' && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          Test Connection
        </Button>

        {testResult.status === 'success' && (
          <div className="flex items-center gap-1.5 text-green-400 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {testResult.message}
          </div>
        )}
        {testResult.status === 'error' && (
          <div className="flex items-center gap-1.5 text-red-400 text-xs">
            <XCircle className="h-3.5 w-3.5" />
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  )
}
