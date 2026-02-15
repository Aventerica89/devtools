'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { ColorPicker } from '@/components/color-picker'
import { checkWcag } from '@/lib/color-utils'
import { cn } from '@/lib/utils'

export function ContrastChecker() {
  const [fg, setFg] = useState('#ffffff')
  const [bg, setBg] = useState('#1e293b')

  const result = useMemo(() => checkWcag(fg, bg), [fg, bg])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorPicker value={fg} onChange={setFg} label="Foreground" />
        <ColorPicker value={bg} onChange={setBg} label="Background" />
      </div>

      {/* Preview */}
      <div
        className="rounded-lg border border-slate-700 p-6 text-center space-y-2"
        style={{ backgroundColor: bg, color: fg }}
      >
        <p className="text-2xl font-bold">Sample Heading</p>
        <p className="text-sm">
          This is body text previewing the foreground color on the background.
        </p>
        <p className="text-xs opacity-80">Small text (14px equivalent)</p>
      </div>

      {/* Ratio + WCAG badges */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase">
            Contrast Ratio
          </span>
          <span
            className={cn(
              'text-2xl font-bold font-mono',
              result.aa ? 'text-green-400' : 'text-red-400'
            )}
          >
            {result.ratio}:1
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <WcagBadge label="AA Normal" pass={result.aa} requirement="4.5:1" />
          <WcagBadge
            label="AAA Normal"
            pass={result.aaa}
            requirement="7:1"
          />
          <WcagBadge
            label="AA Large"
            pass={result.aaLarge}
            requirement="3:1"
          />
          <WcagBadge
            label="AAA Large"
            pass={result.aaaLarge}
            requirement="4.5:1"
          />
        </div>
      </div>
    </div>
  )
}

function WcagBadge({
  label,
  pass,
  requirement,
}: {
  readonly label: string
  readonly pass: boolean
  readonly requirement: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border p-3',
        pass
          ? 'border-green-800 bg-green-950/30'
          : 'border-red-800 bg-red-950/30'
      )}
    >
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">Min {requirement}</p>
      </div>
      <Badge
        variant="secondary"
        className={cn(
          'text-xs',
          pass ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
        )}
      >
        {pass ? 'PASS' : 'FAIL'}
      </Badge>
    </div>
  )
}
