'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bot, Info } from 'lucide-react'
import { AiProviderCard } from '@/components/settings/ai-provider-card'

type AiStatus = {
  anthropic: { configured: boolean }
  google: { configured: boolean }
}

const ANTHROPIC_MODELS = [
  'Claude Sonnet 4.5',
  'Claude Haiku 4.5',
  'Claude Opus 4',
] as const

const GOOGLE_MODELS = [
  'Gemini 2.0 Flash',
  'Gemini 2.0 Pro',
] as const

export default function AiSettingsPage() {
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/status')
      const data = await res.json()
      setStatus(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading AI configuration...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Configure AI provider API keys and test connections.
      </p>

      {/* Info banner */}
      <div className="flex gap-3 p-4 rounded-lg border border-blue-900/50 bg-blue-950/30">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200 space-y-1">
          <p className="font-medium">API key storage</p>
          <p className="text-blue-300/80">
            Keys are saved to the database and used for AI features.
            You can also set them as environment variables
            (<code className="px-1 py-0.5 rounded bg-blue-900/50 text-xs">.env.local</code>)
            which take lower priority.
          </p>
        </div>
      </div>

      {/* Provider cards */}
      <div className="grid gap-4">
        <AiProviderCard
          name="Anthropic"
          provider="anthropic"
          envVar="ANTHROPIC_API_KEY"
          isConfigured={status?.anthropic.configured ?? false}
          models={[...ANTHROPIC_MODELS]}
          onKeyChanged={fetchStatus}
        />
        <AiProviderCard
          name="Google AI"
          provider="google"
          envVar="GOOGLE_GENERATIVE_AI_API_KEY"
          isConfigured={status?.google.configured ?? false}
          models={[...GOOGLE_MODELS]}
          onKeyChanged={fetchStatus}
        />
      </div>

      {/* Setup instructions */}
      <div className="border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          Alternative: Environment Variables
        </h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>You can also set keys via <code className="px-1 py-0.5 rounded bg-muted text-xs">.env.local</code>:</p>
          <pre className="text-xs bg-background border border-border rounded-md p-3 font-mono text-foreground overflow-x-auto">
{`ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...`}
          </pre>
          <p>
            Restart the dev server after adding keys. Database-stored keys take priority.
          </p>
        </div>
      </div>
    </div>
  )
}
