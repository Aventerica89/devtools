'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Code2, Palette, Smartphone, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEV_LINKS = [
  {
    href: '/style-guide',
    label: 'Style Guide',
    description: 'Component library and design tokens',
    icon: Palette,
    color: 'text-purple-400',
  },
  {
    href: '/mobile-app',
    label: 'Mobile App',
    description: 'Phone mockup and responsive preview',
    icon: Smartphone,
    color: 'text-cyan-400',
  },
] as const

export function DevButton() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return <DevButtonInner />
}

function DevButtonInner() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Dropdown menu */}
      <div
        className={cn(
          'absolute bottom-14 right-0 w-64',
          'bg-slate-900 border border-slate-700 rounded-lg shadow-xl',
          'transition-all duration-200 origin-bottom-right',
          open
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        )}
      >
        <div className="p-1.5">
          {DEV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-start gap-3 px-3 py-2.5 rounded-md',
                'transition-colors',
                'hover:bg-slate-800/70'
              )}
            >
              <link.icon className={cn('h-4 w-4 mt-0.5 shrink-0', link.color)} />
              <div>
                <p className="text-sm font-medium text-white">{link.label}</p>
                <p className="text-xs text-slate-400">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center',
          'bg-slate-800 border border-slate-700',
          'text-slate-400 hover:text-white hover:border-slate-500',
          'transition-all duration-200 shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
          open && 'bg-slate-700 text-white border-slate-500'
        )}
        aria-label="Dev tools menu"
      >
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <Code2 className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
