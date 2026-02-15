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
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TestResult = {
  status: 'idle' | 'testing' | 'success' | 'error'
  message: string
}

type AiProviderCardProps = {
  readonly name: string
  readonly provider: string
  readonly envVar: string
  readonly isConfigured: boolean
  readonly models: ReadonlyArray<string>
}

export function AiProviderCard({
  name,
  provider,
  envVar,
  isConfigured,
  models,
}: AiProviderCardProps) {
  const [showKey, setShowKey] = useState(false)
  const [testResult, setTestResult] = useState<TestResult>({
    status: 'idle',
    message: '',
  })

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

      {/* Key display */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">API Key</Label>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            type={showKey ? 'text' : 'password'}
            value={isConfigured ? 'sk-...configured-on-server' : ''}
            placeholder="Not configured"
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
