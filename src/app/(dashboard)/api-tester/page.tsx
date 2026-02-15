'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'
import {
  RequestBuilder,
  type RequestConfig,
  type SavedRequest,
} from '@/components/request-builder'
import {
  ResponseViewer,
  type ResponseData,
} from '@/components/response-viewer'

export default function ApiTesterPage() {
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([])
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const fetchSavedRequests = useCallback(async () => {
    const res = await fetch('/api/requests')
    const data = await res.json()
    setSavedRequests(data)
  }, [])

  useEffect(() => {
    fetchSavedRequests().then(() => setInitialLoad(false))
  }, [fetchSavedRequests])

  async function handleSend(config: RequestConfig) {
    setIsLoading(true)
    setResponse(null)

    try {
      const headersObj: Record<string, string> = {}
      for (const h of config.headers) {
        if (h.key.trim()) {
          headersObj[h.key] = h.value
        }
      }

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: config.method,
          url: config.url,
          headers: headersObj,
          body: config.body || null,
        }),
      })

      const data = await res.json()
      setResponse(data)
    } catch {
      setResponse({
        status: 0,
        statusText: 'Proxy Error',
        headers: {},
        body: 'Failed to reach proxy endpoint',
        timing: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveRequest(
    name: string,
    config: RequestConfig
  ) {
    await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        method: config.method,
        url: config.url,
        headers: config.headers.filter((h) => h.key.trim()),
        body: config.body || null,
      }),
    })
    fetchSavedRequests()
  }

  async function handleDeleteRequest(id: number) {
    await fetch(`/api/requests/${id}`, { method: 'DELETE' })
    fetchSavedRequests()
  }

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading API Tester...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-slate-400" />
        <h1 className="text-xl font-bold">API Tester</h1>
        <Badge variant="secondary" className="text-xs">
          {savedRequests.length} saved
        </Badge>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Request Builder */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <RequestBuilder
            onSend={handleSend}
            isLoading={isLoading}
            savedRequests={savedRequests}
            onLoadRequest={() => {}}
            onSaveRequest={handleSaveRequest}
            onDeleteRequest={handleDeleteRequest}
          />
        </div>

        {/* Right: Response Viewer */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <ResponseViewer
            response={response}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
