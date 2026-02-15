'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading AI configuration...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Configure AI provider API keys and test connections.
      </p>

      {/* Info banner */}
      <div className="flex gap-3 p-4 rounded-lg border border-blue-900/50 bg-blue-950/30">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200 space-y-1">
          <p className="font-medium">Server-side environment variables</p>
          <p className="text-blue-300/80">
            API keys are configured as server environment variables.
            Set them in your <code className="px-1 py-0.5 rounded bg-blue-900/50 text-xs">.env.local</code> file
            or via the Vercel dashboard for production.
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
        />
        <AiProviderCard
          name="Google AI"
          provider="google"
          envVar="GOOGLE_GENERATIVE_AI_API_KEY"
          isConfigured={status?.google.configured ?? false}
          models={[...GOOGLE_MODELS]}
        />
      </div>

      {/* Setup instructions */}
      <div className="border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="font-medium text-white flex items-center gap-2">
          <Bot className="h-4 w-4 text-slate-400" />
          Setup Instructions
        </h3>
        <div className="text-sm text-slate-400 space-y-2">
          <p>1. Create a <code className="px-1 py-0.5 rounded bg-slate-800 text-xs">.env.local</code> file in the project root:</p>
          <pre className="text-xs bg-slate-950 border border-slate-800 rounded-md p-3 font-mono text-slate-300 overflow-x-auto">
{`ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...`}
          </pre>
          <p>
            2. Restart the dev server after adding keys.
          </p>
          <p>
            3. For production, add these variables in the Vercel
            dashboard under Project Settings &gt; Environment Variables.
          </p>
        </div>
      </div>
    </div>
  )
}
