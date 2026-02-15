'use client'

import { useState } from 'react'
import { Palette } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ColorPicker } from '@/components/color-picker'
import { ContrastChecker } from '@/components/contrast-checker'
import { GradientBuilder } from '@/components/gradient-builder'
import { TailwindLookup } from '@/components/tailwind-lookup'
import { BoxShadowGenerator } from '@/components/box-shadow-generator'

export default function ColorsPage() {
  const [pickerColor, setPickerColor] = useState('#3b82f6')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Color / CSS Tools</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="picker">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="picker" className="text-xs">
            Color Picker
          </TabsTrigger>
          <TabsTrigger value="contrast" className="text-xs">
            Contrast
          </TabsTrigger>
          <TabsTrigger value="gradient" className="text-xs">
            Gradient
          </TabsTrigger>
          <TabsTrigger value="tailwind" className="text-xs">
            Tailwind
          </TabsTrigger>
          <TabsTrigger value="shadow" className="text-xs">
            Box Shadow
          </TabsTrigger>
        </TabsList>

        {/* Color Picker */}
        <TabsContent value="picker">
          <div className="rounded-lg border border-border bg-card p-4">
            <ColorPicker
              value={pickerColor}
              onChange={setPickerColor}
              label="Pick a color"
            />
          </div>
        </TabsContent>

        {/* Contrast Checker */}
        <TabsContent value="contrast">
          <div className="rounded-lg border border-border bg-card p-4">
            <ContrastChecker />
          </div>
        </TabsContent>

        {/* Gradient Builder */}
        <TabsContent value="gradient">
          <div className="rounded-lg border border-border bg-card p-4">
            <GradientBuilder />
          </div>
        </TabsContent>

        {/* Tailwind Lookup */}
        <TabsContent value="tailwind">
          <div className="rounded-lg border border-border bg-card p-4">
            <TailwindLookup />
          </div>
        </TabsContent>

        {/* Box Shadow */}
        <TabsContent value="shadow">
          <div className="rounded-lg border border-border bg-card p-4">
            <BoxShadowGenerator />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
