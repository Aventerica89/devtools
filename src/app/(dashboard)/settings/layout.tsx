'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FolderKanban, Bot, Puzzle } from 'lucide-react'

const SETTINGS_TABS = [
  {
    href: '/settings/projects',
    label: 'Projects',
    icon: FolderKanban,
  },
  {
    href: '/settings/ai',
    label: 'AI Config',
    icon: Bot,
  },
  {
    href: '/settings/widget',
    label: 'Widget Setup',
    icon: Puzzle,
  },
] as const

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage projects, AI providers, and widget configuration.
        </p>
      </div>

      <nav className="flex gap-1 border-b border-border pb-px">
        {SETTINGS_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm rounded-t-md',
              'transition-colors border-b-2',
              pathname === tab.href
                ? 'border-foreground text-foreground bg-muted/50'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </nav>

      <div>{children}</div>
    </div>
  )
}
