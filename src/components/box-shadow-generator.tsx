'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Copy, Check } from 'lucide-react'
import { hexToRgb } from '@/lib/color-utils'

type ShadowState = {
  readonly x: number
  readonly y: number
  readonly blur: number
  readonly spread: number
  readonly color: string
  readonly opacity: number
  readonly inset: boolean
}

const INITIAL_STATE: ShadowState = {
  x: 4,
  y: 4,
  blur: 12,
  spread: 0,
  color: '#000000',
  opacity: 50,
  inset: false,
}

export function BoxShadowGenerator() {
  const [shadow, setShadow] = useState<ShadowState>(INITIAL_STATE)
  const [copied, setCopied] = useState(false)

  const cssValue = useMemo(() => {
    const rgb = hexToRgb(shadow.color)
    const alpha = shadow.opacity / 100
    const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
    const insetStr = shadow.inset ? 'inset ' : ''
    return `${insetStr}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${rgba}`
  }, [shadow])

  const cssOutput = `box-shadow: ${cssValue};`

  const updateField = useCallback(
    <K extends keyof ShadowState>(
      field: K,
      value: ShadowState[K]
    ) => {
      setShadow((prev) => ({ ...prev, [field]: value }))
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
      <div className="flex items-center justify-center h-48 rounded-lg border border-slate-800 bg-slate-900">
        <div
          className="w-32 h-32 rounded-lg bg-slate-700"
          style={{ boxShadow: cssValue }}
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <SliderField
          label="X Offset"
          value={shadow.x}
          min={-50}
          max={50}
          onChange={(v) => updateField('x', v)}
        />
        <SliderField
          label="Y Offset"
          value={shadow.y}
          min={-50}
          max={50}
          onChange={(v) => updateField('y', v)}
        />
        <SliderField
          label="Blur"
          value={shadow.blur}
          min={0}
          max={100}
          onChange={(v) => updateField('blur', v)}
        />
        <SliderField
          label="Spread"
          value={shadow.spread}
          min={-50}
          max={50}
          onChange={(v) => updateField('spread', v)}
        />
        <SliderField
          label="Opacity"
          value={shadow.opacity}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => updateField('opacity', v)}
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-400">Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={shadow.color}
              onChange={(e) => updateField('color', e.target.value)}
              className="w-10 h-8 rounded cursor-pointer bg-transparent"
            />
            <span className="font-mono text-sm text-slate-300">
              {shadow.color}
            </span>
          </div>
        </div>
      </div>

      {/* Inset toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateField('inset', !shadow.inset)}
          className={
            shadow.inset
              ? 'px-3 py-1.5 rounded-md text-xs border border-blue-600 bg-blue-600/20 text-blue-300'
              : 'px-3 py-1.5 rounded-md text-xs border border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
          }
        >
          Inset
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShadow(INITIAL_STATE)}
          className="text-xs text-slate-400 hover:text-white h-7"
        >
          Reset
        </Button>
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

function SliderField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly suffix?: string
  readonly onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-400">{label}</Label>
        <span className="text-xs font-mono text-slate-300">
          {value}
          {suffix ?? 'px'}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-blue-500"
      />
    </div>
  )
}
