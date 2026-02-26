'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import {
  Bug, Terminal, Globe, AlertTriangle, Gauge,
  Send, Braces, Regex, Palette, KeyRound,
  GitBranch, ScrollText, Settings, FolderKanban,
  BookOpen, Smartphone, LayoutDashboard, History,
  Library, ListChecks, Lightbulb, Menu,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

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
    label: 'Resources',
    items: [
      { href: '/hub', label: 'Hub', icon: Library, roles: OWNER_DEV },
      { href: '/routines', label: 'Routines', icon: ListChecks, roles: OWNER_DEV },
    ],
  },
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
      { href: '/ideas', label: 'Ideas', icon: Lightbulb, roles: ALL_ROLES },
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
  return 'viewer'
}

function SidebarNav({
  counts,
  onNavigate,
}: {
  counts: { bugs: number; errors: number; ideas: number }
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { user } = useUser()
  const role = getRole(user?.publicMetadata as Record<string, unknown> | undefined)

  const visibleSections = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    })).filter((section) => section.items.length > 0)
  }, [role])

  return (
    <ScrollArea className="flex-1 px-2">
      {visibleSections.map((section, i) => (
        <div key={section.label} role="group" aria-labelledby={`section-${section.label}`}>
          {i > 0 && <Separator className="my-2 bg-border" />}
          <p
            id={`section-${section.label}`}
            className="px-3 py-1 text-xs font-semibold text-foreground/60 uppercase tracking-wide"
          >
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
                onClick={onNavigate}
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
                {item.href === '/bugs' && counts.bugs > 0 && (
                  <span className="ml-auto text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full leading-none">
                    {counts.bugs}
                  </span>
                )}
                {item.href === '/errors' && counts.errors > 0 && (
                  <span className="ml-auto text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full leading-none">
                    {counts.errors}
                  </span>
                )}
                {item.href === '/ideas' && counts.ideas > 0 && (
                  <span className="ml-auto text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full leading-none">
                    {counts.ideas}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </ScrollArea>
  )
}

export function Sidebar() {
  const [counts, setCounts] = useState({ bugs: 0, errors: 0, ideas: 0 })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/bugs?status=open&limit=500')
      .then((r) => r.json())
      .then((d) => setCounts((prev) => ({ ...prev, bugs: Array.isArray(d) ? d.length : 0 })))
      .catch(() => {})
    fetch('/api/devlog?type=error&days=1&limit=500')
      .then((r) => r.json())
      .then((d) => setCounts((prev) => ({ ...prev, errors: Array.isArray(d) ? d.length : 0 })))
      .catch(() => {})
    fetch('/api/ideas?status=idea&limit=500')
      .then((r) => r.json())
      .then((d) => setCounts((prev) => ({ ...prev, ideas: Array.isArray(d) ? d.length : 0 })))
      .catch(() => {})
  }, [])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-56 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-lg font-bold text-foreground">DevTools</h1>
            <div aria-label="User account">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
          <SidebarNav counts={counts} onNavigate={closeMobile} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex w-56 border-r border-border bg-background flex-col shrink-0"
        aria-label="Main navigation"
      >
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">DevTools</h1>
          <div aria-label="User account">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
        <SidebarNav counts={counts} />
      </nav>
    </>
  )
}
