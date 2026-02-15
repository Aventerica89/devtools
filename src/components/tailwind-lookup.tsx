'use client'

import { useState, useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check } from 'lucide-react'
import {
  findClosestTailwindColor,
  getTailwindPalette,
} from '@/lib/color-utils'
import { cn } from '@/lib/utils'

const palette = getTailwindPalette()

export function TailwindLookup() {
  const [selectedColor, setSelectedColor] = useState('#3b82f6')
  const [copied, setCopied] = useState<string | null>(null)

  const closest = useMemo(
    () => findClosestTailwindColor(selectedColor),
    [selectedColor]
  )

  const handleCopy = useCallback((className: string) => {
    navigator.clipboard.writeText(className)
    setCopied(className)
    setTimeout(() => setCopied(null), 1500)
  }, [])

  return (
    <div className="space-y-4">
      {/* Picker + closest result */}
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-16 h-10 rounded cursor-pointer bg-transparent"
        />
        <div className="flex-1">
          <p className="text-xs text-slate-500">Your color</p>
          <p className="font-mono text-sm text-slate-300">{selectedColor}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Closest Tailwind</p>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="font-mono text-xs cursor-pointer hover:bg-slate-700"
              onClick={() => handleCopy(closest)}
            >
              {closest}
            </Badge>
            {copied === closest && (
              <Check className="h-3.5 w-3.5 text-green-400" />
            )}
          </div>
        </div>
      </div>

      {/* Full palette */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-3 pr-3">
          {palette.map((group) => (
            <div key={group.name}>
              <p className="text-xs font-medium text-slate-500 mb-1 capitalize">
                {group.name}
              </p>
              <div className="flex gap-0.5">
                {group.shades.map((shade) => {
                  const fullName = `${group.name}-${shade.shade}`
                  const isClosest = fullName === closest
                  return (
                    <button
                      key={shade.shade}
                      onClick={() => handleCopy(fullName)}
                      title={`${fullName} (${shade.hex})`}
                      className={cn(
                        'flex-1 h-8 rounded-sm transition-all',
                        'hover:scale-110 hover:z-10 relative',
                        isClosest && 'ring-2 ring-white ring-offset-1 ring-offset-slate-950'
                      )}
                      style={{ backgroundColor: shade.hex }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
