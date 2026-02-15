'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionWrapper } from './section-wrapper'

export function FormDemo() {
  const [sliderValue, setSliderValue] = useState<number[]>([50])

  return (
    <SectionWrapper
      id="forms"
      title="Form Controls"
      description="Input, Textarea, Select, Switch, and Slider"
    >
      <div className="grid gap-8 sm:grid-cols-2">
        {/* Text Inputs */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Text Inputs</h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="text-input" className="text-slate-300">
                Text
              </Label>
              <Input
                id="text-input"
                placeholder="Enter text..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-input" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email-input"
                type="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password-input" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password-input"
                type="password"
                placeholder="Password"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="disabled-input"
                className="text-slate-300"
              >
                Disabled
              </Label>
              <Input
                id="disabled-input"
                disabled
                placeholder="Cannot edit"
              />
            </div>
          </div>
        </div>

        {/* Textarea + Select */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">
            Textarea & Select
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="textarea-demo" className="text-slate-300">
                Textarea
              </Label>
              <Textarea
                id="textarea-demo"
                placeholder="Write something..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Select</Label>
              <Select defaultValue="option-1">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option-1">Option One</SelectItem>
                  <SelectItem value="option-2">Option Two</SelectItem>
                  <SelectItem value="option-3">Option Three</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Switch */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Switch</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch id="switch-1" defaultChecked />
              <Label htmlFor="switch-1" className="text-slate-300">
                Enabled by default
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="switch-2" />
              <Label htmlFor="switch-2" className="text-slate-300">
                Disabled by default
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="switch-3" size="sm" />
              <Label htmlFor="switch-3" className="text-slate-300">
                Small size
              </Label>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Slider</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Value: {sliderValue[0]}
              </Label>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
