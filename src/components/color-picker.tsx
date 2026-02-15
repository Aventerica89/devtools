'use client'

import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  isValidHex,
  normalizeHex,
  type RGB,
  type HSL,
} from '@/lib/color-utils'

type CopiedField = 'hex' | 'rgb' | 'hsl' | null

type ColorPickerProps = {
  readonly value: string
  readonly onChange: (hex: string) => void
  readonly label?: string
  readonly showFormats?: boolean
}

export function ColorPicker({
  value,
  onChange,
  label,
  showFormats = true,
}: ColorPickerProps) {
  const rgb = hexToRgb(value)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  const [hexInput, setHexInput] = useState(value)
  const [copied, setCopied] = useState<CopiedField>(null)

  useEffect(() => {
    setHexInput(value)
  }, [value])

  const handleNativeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const handleHexBlur = useCallback(() => {
    if (isValidHex(hexInput)) {
      onChange(normalizeHex(hexInput))
    } else {
      setHexInput(value)
    }
  }, [hexInput, value, onChange])

  const handleHexKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleHexBlur()
      }
    },
    [handleHexBlur]
  )

  const handleRgbChange = useCallback(
    (channel: keyof RGB, val: string) => {
      const n = parseInt(val, 10)
      if (isNaN(n)) return
      const clamped = Math.max(0, Math.min(255, n))
      const updated: RGB = { ...rgb, [channel]: clamped }
      onChange(rgbToHex(updated.r, updated.g, updated.b))
    },
    [rgb, onChange]
  )

  const handleHslChange = useCallback(
    (channel: keyof HSL, val: string) => {
      const n = parseInt(val, 10)
      if (isNaN(n)) return
      const max = channel === 'h' ? 360 : 100
      const clamped = Math.max(0, Math.min(max, n))
      const updated: HSL = { ...hsl, [channel]: clamped }
      const newRgb = hslToRgb(updated.h, updated.s, updated.l)
      onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b))
    },
    [hsl, onChange]
  )

  const copyValue = useCallback(
    (field: CopiedField) => {
      if (!field) return
      const text =
        field === 'hex'
          ? value
          : field === 'rgb'
            ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
            : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
      navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 1500)
    },
    [value, rgb, hsl]
  )

  return (
    <div className="space-y-3">
      {label && (
        <Label className="text-xs font-medium text-muted-foreground uppercase">
          {label}
        </Label>
      )}

      <div className="flex items-start gap-4">
        {/* Native picker + swatch */}
        <div className="space-y-2">
          <div
            className="w-20 h-20 rounded-lg border border-border"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={handleNativeChange}
            className="w-20 h-8 rounded cursor-pointer bg-transparent"
          />
        </div>

        {/* Format inputs */}
        {showFormats && (
          <div className="flex-1 space-y-2">
            {/* Hex */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8">HEX</span>
              <Input
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={handleHexBlur}
                onKeyDown={handleHexKeyDown}
                className="flex-1 font-mono text-sm bg-background border-border h-8"
              />
              <CopyButton
                active={copied === 'hex'}
                onClick={() => copyValue('hex')}
              />
            </div>

            {/* RGB */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8">RGB</span>
              <div className="flex-1 flex gap-1">
                {(['r', 'g', 'b'] as const).map((ch) => (
                  <Input
                    key={ch}
                    type="number"
                    min={0}
                    max={255}
                    value={rgb[ch]}
                    onChange={(e) => handleRgbChange(ch, e.target.value)}
                    className="font-mono text-sm bg-background border-border h-8 w-20"
                  />
                ))}
              </div>
              <CopyButton
                active={copied === 'rgb'}
                onClick={() => copyValue('rgb')}
              />
            </div>

            {/* HSL */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8">HSL</span>
              <div className="flex-1 flex gap-1">
                <Input
                  type="number"
                  min={0}
                  max={360}
                  value={hsl.h}
                  onChange={(e) => handleHslChange('h', e.target.value)}
                  className="font-mono text-sm bg-background border-border h-8 w-20"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hsl.s}
                  onChange={(e) => handleHslChange('s', e.target.value)}
                  className="font-mono text-sm bg-background border-border h-8 w-20"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hsl.l}
                  onChange={(e) => handleHslChange('l', e.target.value)}
                  className="font-mono text-sm bg-background border-border h-8 w-20"
                />
              </div>
              <CopyButton
                active={copied === 'hsl'}
                onClick={() => copyValue('hsl')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CopyButton({
  active,
  onClick,
}: {
  readonly active: boolean
  readonly onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
    >
      {active ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
