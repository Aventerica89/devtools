'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export default function UnlockPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Invalid PIN')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-80 bg-card border-border">
        <CardHeader className="text-center">
          <Lock className="mx-auto h-8 w-8 text-blue-500 mb-2" />
          <CardTitle>DevTools</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] bg-muted border-input"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || pin.length < 4}
            >
              {loading ? 'Verifying...' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
