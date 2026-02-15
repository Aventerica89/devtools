'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type GradientStop = {
  readonly id: string
  readonly color: string
}

type Direction =
  | 'to right'
  | 'to bottom'
  | 'to bottom right'
  | 'to top right'
  | 'radial'

const DIRECTIONS: readonly { readonly value: Direction; readonly label: string }[] = [
  { value: 'to right', label: 'Right' },
  { value: 'to bottom', label: 'Down' },
  { value: 'to bottom right', label: 'Diagonal' },
  { value: 'to top right', label: 'Up Right' },
  { value: 'radial', label: 'Radial' },
]

let nextId = 3

export function GradientBuilder() {
  const [stops, setStops] = useState<readonly GradientStop[]>([
    { id: '1', color: '#3b82f6' },
    { id: '2', color: '#8b5cf6' },
  ])
  const [direction, setDirection] = useState<Direction>('to right')
  const [copied, setCopied] = useState(false)

  const cssValue = useMemo(() => {
    const colors = stops.map((s) => s.color).join(', ')
    if (direction === 'radial') {
      return `radial-gradient(circle, ${colors})`
    }
    return `linear-gradient(${direction}, ${colors})`
  }, [stops, direction])

  const cssOutput = `background: ${cssValue};`

  const addStop = useCallback(() => {
    const id = String(nextId++)
    setStops((prev) => [...prev, { id, color: '#10b981' }])
  }, [])

  const removeStop = useCallback((id: string) => {
    setStops((prev) => {
      if (prev.length <= 2) return prev
      return prev.filter((s) => s.id !== id)
    })
  }, [])

  const updateStopColor = useCallback(
    (id: string, color: string) => {
      setStops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, color } : s))
      )
    },
    []
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cssOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [cssOutput])

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div
        className="h-32 rounded-lg border border-slate-700"
        style={{ background: cssValue }}
      />

      {/* Direction selector */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-slate-400 uppercase">
          Direction
        </span>
        <div className="flex flex-wrap gap-2">
          {DIRECTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDirection(d.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs border transition-colors',
                direction === d.value
                  ? 'border-blue-600 bg-blue-600/20 text-blue-300'
                  : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase">
            Color Stops
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={addStop}
            className="text-xs text-slate-400 hover:text-white h-7"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {stops.map((stop) => (
            <div key={stop.id} className="flex items-center gap-2">
              <input
                type="color"
                value={stop.color}
                onChange={(e) => updateStopColor(stop.id, e.target.value)}
                className="w-10 h-8 rounded cursor-pointer bg-transparent"
              />
              <span className="font-mono text-sm text-slate-300 flex-1">
                {stop.color}
              </span>
              {stops.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStop(stop.id)}
                  className="h-7 w-7 p-0 text-slate-500 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CSS output */}
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 flex items-center gap-2">
        <code className="flex-1 text-sm font-mono text-slate-300 break-all">
          {cssOutput}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 h-8 w-8 p-0 text-slate-400 hover:text-white"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  )
}
