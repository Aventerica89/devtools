'use client'

import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ColorSwatches } from '@/components/style-guide/color-swatches'
import { TypographyDemo } from '@/components/style-guide/typography-demo'
import { ButtonDemo } from '@/components/style-guide/button-demo'
import { FormDemo } from '@/components/style-guide/form-demo'
import { CardDemo } from '@/components/style-guide/card-demo'
import { BadgeDemo } from '@/components/style-guide/badge-demo'
import { TableDemo } from '@/components/style-guide/table-demo'
import { DialogDemo } from '@/components/style-guide/dialog-demo'
import { TabsDemo } from '@/components/style-guide/tabs-demo'
import { SpacingDemo } from '@/components/style-guide/spacing-demo'

const TOC_ITEMS = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'forms', label: 'Form Controls' },
  { id: 'cards', label: 'Cards' },
  { id: 'badges', label: 'Badges' },
  { id: 'tables', label: 'Tables' },
  { id: 'dialogs', label: 'Dialogs' },
  { id: 'tabs', label: 'Tabs' },
  { id: 'spacing', label: 'Spacing' },
] as const

export default function StyleGuidePage() {
  const [activeSection, setActiveSection] = useState('colors')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible?.target.id) {
          setActiveSection(visible.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    const sections = TOC_ITEMS.map((item) =>
      document.getElementById(item.id)
    ).filter(Boolean)

    sections.forEach((section) => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex gap-6">
      {/* Sticky Sidebar TOC */}
      <nav className="sticky top-0 hidden w-48 shrink-0 lg:block">
        <div className="space-y-1 py-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Contents
            </span>
          </div>
          {TOC_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTocClick(item.id)}
              className={cn(
                'block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                activeSection === item.id
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {/* Page Header */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">Style Guide</h1>
            <p className="text-sm text-muted-foreground">
              Component reference for maintaining consistent design across
              this dashboard. Not related to your projects -- this documents
              the DevTools UI itself.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            <ColorSwatches />
            <TypographyDemo />
            <ButtonDemo />
            <FormDemo />
            <CardDemo />
            <BadgeDemo />
            <TableDemo />
            <DialogDemo />
            <TabsDemo />
            <SpacingDemo />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
