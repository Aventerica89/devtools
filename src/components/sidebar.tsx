'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import {
  Bug, Terminal, Globe, AlertTriangle, Gauge,
  Send, Braces, Regex, Palette, KeyRound,
  GitBranch, ScrollText, Settings, FolderKanban,
  BookOpen, Smartphone, LayoutDashboard, History
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

type Role = 'owner' | 'dev' | 'viewer'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: Role[]
}

interface NavSection {
  label: string
  items: NavItem[]
}

const ALL_ROLES: Role[] = ['owner', 'dev', 'viewer']
const OWNER_DEV: Role[] = ['owner', 'dev']
const OWNER_ONLY: Role[] = ['owner']

const sections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
    ],
  },
  {
    label: 'Debug',
    items: [
      { href: '/bugs', label: 'Bug Tracker', icon: Bug, roles: ALL_ROLES },
      { href: '/console', label: 'Console Log', icon: Terminal, roles: OWNER_DEV },
      { href: '/network', label: 'Network Log', icon: Globe, roles: OWNER_DEV },
      { href: '/errors', label: 'Error Log', icon: AlertTriangle, roles: OWNER_DEV },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/api-tester', label: 'API Tester', icon: Send, roles: OWNER_DEV },
      { href: '/json', label: 'JSON Viewer', icon: Braces, roles: OWNER_DEV },
      { href: '/regex', label: 'Regex Tester', icon: Regex, roles: OWNER_DEV },
      { href: '/colors', label: 'Color / CSS', icon: Palette, roles: OWNER_DEV },
    ],
  },
  {
    label: 'Ops',
    items: [
      { href: '/deployments', label: 'Deployments', icon: GitBranch, roles: OWNER_DEV },
      { href: '/env', label: 'Env Vars', icon: KeyRound, roles: OWNER_ONLY },
      { href: '/devlog', label: 'Dev Log', icon: ScrollText, roles: OWNER_DEV },
      { href: '/perf', label: 'Perf Audit', icon: Gauge, roles: OWNER_DEV },
    ],
  },
  {
    label: 'Dev',
    items: [
      { href: '/style-guide', label: 'Style Guide', icon: BookOpen, roles: OWNER_DEV },
      { href: '/mobile-app', label: 'Mobile App', icon: Smartphone, roles: OWNER_DEV },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/settings/projects', label: 'Projects', icon: FolderKanban, roles: OWNER_ONLY },
      { href: '/settings/ai', label: 'AI Config', icon: Settings, roles: OWNER_ONLY },
      { href: '/settings/widget', label: 'Widget Setup', icon: Settings, roles: OWNER_ONLY },
      { href: '/changelog', label: 'Changelog', icon: History, roles: ALL_ROLES },
    ],
  },
]

function getRole(publicMetadata: Record<string, unknown> | undefined): Role {
  const role = publicMetadata?.role
  if (role === 'owner' || role === 'dev' || role === 'viewer') return role
  // Default new users to viewer
  return 'viewer'
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const role = getRole(user?.publicMetadata as Record<string, unknown> | undefined)

  // Memoize filtered sections to avoid recalculating on every render
  const visibleSections = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    })).filter((section) => section.items.length > 0)
  }, [role])

  return (
    <nav className="w-56 border-r border-border bg-background flex flex-col" aria-label="Main navigation">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">DevTools</h1>
        <div aria-label="User account">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        {visibleSections.map((section, i) => {
          return (
            <div key={section.label} role="group" aria-labelledby={`section-${section.label}`}>
              {i > 0 && <Separator className="my-2 bg-border" />}
              <p id={`section-${section.label}`} className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase">
                {section.label}
              </p>
              {section.items.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                      'transition-colors',
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </ScrollArea>
    </nav>
  )
}
