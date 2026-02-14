'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Bug, Terminal, Globe, AlertTriangle, Gauge,
  Send, Braces, Regex, Palette, KeyRound,
  GitBranch, ScrollText, Settings, FolderKanban
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const sections = [
  {
    label: 'Debug',
    items: [
      { href: '/bugs', label: 'Bug Tracker', icon: Bug },
      { href: '/console', label: 'Console Log', icon: Terminal },
      { href: '/network', label: 'Network Log', icon: Globe },
      { href: '/errors', label: 'Error Log', icon: AlertTriangle },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/api-tester', label: 'API Tester', icon: Send },
      { href: '/json', label: 'JSON Viewer', icon: Braces },
      { href: '/regex', label: 'Regex Tester', icon: Regex },
      { href: '/colors', label: 'Color / CSS', icon: Palette },
    ],
  },
  {
    label: 'Ops',
    items: [
      { href: '/deployments', label: 'Deployments', icon: GitBranch },
      { href: '/env', label: 'Env Vars', icon: KeyRound },
      { href: '/devlog', label: 'Dev Log', icon: ScrollText },
      { href: '/perf', label: 'Perf Audit', icon: Gauge },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/settings/projects', label: 'Projects', icon: FolderKanban },
      { href: '/settings/ai', label: 'AI Config', icon: Settings },
      { href: '/settings/widget', label: 'Widget Setup', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-56 border-r border-slate-800 bg-slate-950 flex flex-col">
      <div className="p-4">
        <h1 className="text-lg font-bold text-white">DevTools</h1>
      </div>
      <ScrollArea className="flex-1 px-2">
        {sections.map((section, i) => (
          <div key={section.label}>
            {i > 0 && <Separator className="my-2 bg-slate-800" />}
            <p className="px-3 py-1 text-xs font-medium text-slate-500 uppercase">
              {section.label}
            </p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                  'transition-colors',
                  pathname === item.href
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}
