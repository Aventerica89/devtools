# DevTools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a universal embeddable developer toolkit SDK — a floating widget (`widget.js`) for any web app + a full dashboard at `devtools.jbcloud.app`.

**Architecture:** Monolith Next.js app (dashboard + API) with a separate Vite+Preact widget build, all in one repo. Widget renders in Shadow DOM, intercepts console/network/errors, sends events to the API. Dashboard provides full-page tools. Turso (SQLite) for data, PIN passcode auth, Vercel hosting.

**Tech Stack:** Next.js 15, React 19, Turso + Drizzle, Preact (widget), Vite (widget build), Tailwind + shadcn/ui, Vercel AI SDK, Lucide icons.

**Design doc:** `docs/plans/2026-02-14-devtools-design.md`

---

## Phase 1: Foundation (Tasks 1-6)

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `.gitignore`, `.env.example`

**Step 1: Initialize Next.js with TypeScript + Tailwind**

```bash
cd /Users/jb/devtools
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

Accept defaults. This overwrites the empty directory with the full scaffold.

**Step 2: Install core dependencies**

```bash
npm install drizzle-orm @libsql/client better-sqlite3 bcryptjs
npm install -D drizzle-kit @types/bcryptjs
```

**Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```

Select: New York style, Slate base color, CSS variables.

**Step 4: Install initial shadcn components**

```bash
npx shadcn@latest add button card input label badge dialog separator tabs scroll-area
```

**Step 5: Install Lucide icons**

```bash
npm install lucide-react
```

**Step 6: Create .env.example**

```bash
# .env.example
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
DEVTOOLS_PIN_HASH=  # bcrypt hash of your PIN
ANTHROPIC_API_KEY=  # For AI features
GOOGLE_GENERATIVE_AI_API_KEY=  # For Gemini fallback
SUPABASE_URL=  # apps.jbcloud.app Supabase
SUPABASE_SERVICE_KEY=  # Service role key for App Tracker reads
```

**Step 7: Update .gitignore**

Add:
```
.env.local
.env*.tpl
!.env.example
```

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind, shadcn, Drizzle"
```

---

### Task 2: Database Schema + Migrations

**Files:**
- Create: `src/lib/db/index.ts`
- Create: `src/lib/db/schema.ts`
- Create: `drizzle.config.ts`

**Step 1: Create Drizzle config**

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config
```

**Step 2: Create database client**

```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
```

**Step 3: Create schema**

```typescript
// src/lib/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const bugs = sqliteTable('bugs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  severity: text('severity').default('medium'),
  status: text('status').default('open'),
  screenshotUrl: text('screenshot_url'),
  stackTrace: text('stack_trace'),
  pageUrl: text('url'),
  userAgent: text('user_agent'),
  metadata: text('metadata'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  resolvedAt: text('resolved_at'),
})

export const devlog = sqliteTable('devlog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  source: text('source').default('manual'),
  metadata: text('metadata'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const savedRequests = sqliteTable('saved_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').references(() => projects.id),
  name: text('name').notNull(),
  method: text('method').notNull(),
  url: text('url').notNull(),
  headers: text('headers'),
  body: text('body'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const widgetConfig = sqliteTable('widget_config', {
  projectId: text('project_id').primaryKey().references(() => projects.id),
  enabledTools: text('enabled_tools'),
  theme: text('theme').default('dark'),
  position: text('position').default('bottom-right'),
  pinHash: text('pin_hash').notNull(),
})
```

**Step 4: Generate and run migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add database schema with Drizzle + Turso"
```

---

### Task 3: PIN Authentication

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/unlock/page.tsx`
- Create: `src/middleware.ts`
- Create: `src/app/api/auth/verify/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Test: `src/lib/__tests__/auth.test.ts`

**Step 1: Write failing test for PIN verification**

```typescript
// src/lib/__tests__/auth.test.ts
import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin, createSessionToken, verifySessionToken } from '../auth'

describe('auth', () => {
  it('should hash and verify a PIN', async () => {
    const pin = '1234'
    const hash = await hashPin(pin)
    expect(await verifyPin(pin, hash)).toBe(true)
    expect(await verifyPin('0000', hash)).toBe(false)
  })

  it('should create and verify session tokens', () => {
    const token = createSessionToken()
    expect(verifySessionToken(token)).toBe(true)
    expect(verifySessionToken('invalid')).toBe(false)
  })
})
```

**Step 2: Install vitest and run test to verify it fails**

```bash
npm install -D vitest @vitejs/plugin-react
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

Run: `npm test`
Expected: FAIL — module not found

**Step 3: Implement auth utilities**

```typescript
// src/lib/auth.ts
import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'

const SESSION_SECRET = process.env.SESSION_SECRET || 'devtools-session-secret'
const SESSION_EXPIRY_DAYS = 7

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export function createSessionToken(): string {
  const payload = JSON.stringify({
    random: randomBytes(32).toString('hex'),
    exp: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  })
  const signature = createHash('sha256')
    .update(payload + SESSION_SECRET)
    .digest('hex')
  return Buffer.from(payload).toString('base64') + '.' + signature
}

export function verifySessionToken(token: string): boolean {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return false
    const payload = Buffer.from(payloadB64, 'base64').toString()
    const expected = createHash('sha256')
      .update(payload + SESSION_SECRET)
      .digest('hex')
    if (signature !== expected) return false
    const data = JSON.parse(payload)
    return data.exp > Date.now()
  } catch {
    return false
  }
}

export function verifyWidgetPin(pinHeader: string, storedHash: string): boolean {
  // Widget sends SHA-256 of PIN. Compare with stored bcrypt hash isn't direct.
  // Instead, widget sends raw PIN over HTTPS, we bcrypt-compare.
  // The data-pin attribute is just for identification, actual auth uses header.
  return false // Implemented in API route with async bcrypt
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Create unlock page**

```typescript
// src/app/unlock/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export default function UnlockPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Invalid PIN')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Card className="w-80 bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <Lock className="mx-auto h-8 w-8 text-blue-500 mb-2" />
          <CardTitle className="text-white">DevTools</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] bg-slate-800 border-slate-700"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || pin.length < 4}>
              {loading ? 'Verifying...' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 6: Create auth API routes**

```typescript
// src/app/api/auth/verify/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyPin, createSessionToken } from '@/lib/auth'

export async function POST(request: Request) {
  const { pin } = await request.json()
  const storedHash = process.env.DEVTOOLS_PIN_HASH

  if (!storedHash) {
    return NextResponse.json({ error: 'PIN not configured' }, { status: 500 })
  }

  const valid = await verifyPin(pin, storedHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const token = createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set('devtools-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return NextResponse.json({ success: true })
}
```

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('devtools-session')
  return NextResponse.json({ success: true })
}
```

**Step 7: Create middleware**

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/unlock', '/api/auth/verify', '/widget.js']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and static assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Allow widget API calls with PIN header
  if (pathname.startsWith('/api/widget') || pathname.startsWith('/api/bugs')) {
    const pinHeader = request.headers.get('x-devtools-pin')
    if (pinHeader) return NextResponse.next() // Verified in API route
  }

  // Check session cookie for dashboard
  const session = request.cookies.get('devtools-session')?.value
  if (!session || !verifySessionToken(session)) {
    return NextResponse.redirect(new URL('/unlock', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add PIN authentication with middleware, unlock page, and session tokens"
```

---

### Task 4: Project CRUD API + Dashboard Shell

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/components/sidebar.tsx`

**Step 1: Create project API routes**

```typescript
// src/app/api/projects/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'

export async function GET() {
  const all = await db.select().from(projects).all()
  return NextResponse.json(all)
}

export async function POST(request: Request) {
  const body = await request.json()
  const result = await db.insert(projects).values({
    id: body.id,
    name: body.name,
    url: body.url || null,
  }).returning()
  return NextResponse.json(result[0], { status: 201 })
}
```

```typescript
// src/app/api/projects/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await db.select().from(projects).where(eq(projects.id, id)).get()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const result = await db.update(projects)
    .set({ name: body.name, url: body.url })
    .where(eq(projects.id, id))
    .returning()
  return NextResponse.json(result[0])
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(projects).where(eq(projects.id, id))
  return NextResponse.json({ success: true })
}
```

**Step 2: Create dashboard sidebar**

```typescript
// src/components/sidebar.tsx
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
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
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
```

**Step 3: Create dashboard layout**

```typescript
// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

**Step 4: Create dashboard home page**

```typescript
// src/app/(dashboard)/page.tsx
export default function DashboardHome() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p className="text-slate-400">Select a tool from the sidebar.</p>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add project CRUD API and dashboard shell with sidebar navigation"
```

---

### Task 5: Bug Tracker API + Dashboard Page

**Files:**
- Create: `src/app/api/bugs/route.ts`
- Create: `src/app/api/bugs/[id]/route.ts`
- Create: `src/app/(dashboard)/bugs/page.tsx`
- Create: `src/components/bug-card.tsx`

**Step 1: Create bug API routes**

```typescript
// src/app/api/bugs/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bugs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project')

  let query = db.select().from(bugs).orderBy(desc(bugs.createdAt))
  if (projectId) {
    query = query.where(eq(bugs.projectId, projectId)) as typeof query
  }

  const all = await query.all()
  return NextResponse.json(all)
}

export async function POST(request: Request) {
  const body = await request.json()
  const result = await db.insert(bugs).values({
    projectId: body.projectId,
    title: body.title,
    description: body.description || null,
    severity: body.severity || 'medium',
    screenshotUrl: body.screenshotUrl || null,
    stackTrace: body.stackTrace || null,
    pageUrl: body.pageUrl || null,
    userAgent: body.userAgent || null,
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
  }).returning()
  return NextResponse.json(result[0], { status: 201 })
}
```

```typescript
// src/app/api/bugs/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bugs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const result = await db.update(bugs)
    .set({
      status: body.status,
      severity: body.severity,
      title: body.title,
      description: body.description,
      resolvedAt: body.status === 'resolved' ? new Date().toISOString() : null,
    })
    .where(eq(bugs.id, parseInt(id)))
    .returning()
  return NextResponse.json(result[0])
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(bugs).where(eq(bugs.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
```

**Step 2: Create bug tracker page (list + quick create)**

Build a page with: project filter dropdown, severity/status filter badges, bug cards with status toggle, and a "New Bug" dialog.

**Step 3: Create bug-card component**

Reusable card showing title, severity badge, status, timestamp, page URL. Click to expand full details + stack trace.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add bug tracker API and dashboard page"
```

---

### Task 6: Dev Log API + Dashboard Page

**Files:**
- Create: `src/app/api/devlog/route.ts`
- Create: `src/app/api/devlog/[id]/route.ts`
- Create: `src/app/(dashboard)/devlog/page.tsx`

**Step 1: Create devlog API routes**

CRUD following same pattern as bugs. GET supports `?project=X&type=error` filters.

**Step 2: Create devlog dashboard page**

Timeline view with type icons (note, error, warning, perf, network). Filter by type/source. Search by title/content. "Add Note" button for manual entries.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add dev log API and dashboard timeline page"
```

---

## Phase 2: Widget Core (Tasks 7-11)

### Task 7: Widget Build Setup (Vite + Preact)

**Files:**
- Create: `widget/vite.config.ts`
- Create: `widget/package.json`
- Create: `widget/src/index.ts`
- Create: `widget/tsconfig.json`

**Step 1: Create widget directory with Vite + Preact config**

```typescript
// widget/vite.config.ts
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DevTools',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    outDir: '../public',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
```

**Step 2: Create widget entry point**

```typescript
// widget/src/index.ts
import { render, h } from 'preact'
import { Toolbar } from './toolbar/FloatingButton'
import { initInterceptors } from './interceptors'

function init() {
  const script = document.currentScript as HTMLScriptElement
  const projectId = script?.getAttribute('data-project') || 'default'
  const pinHash = script?.getAttribute('data-pin') || ''
  const apiBase = script?.src.replace('/widget.js', '') || ''

  // Create shadow DOM host
  const host = document.createElement('div')
  host.id = 'devtools-widget'
  document.body.appendChild(host)
  const shadow = host.attachShadow({ mode: 'open' })

  // Inject styles
  const style = document.createElement('style')
  style.textContent = WIDGET_CSS // Bundled inline
  shadow.appendChild(style)

  // Mount Preact app
  const root = document.createElement('div')
  shadow.appendChild(root)
  render(h(Toolbar, { projectId, pinHash, apiBase }), root)

  // Start interceptors
  initInterceptors(projectId, pinHash, apiBase)
}

// Auto-init when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

const WIDGET_CSS = `/* Injected at build time via Vite plugin */`
```

**Step 3: Install widget dependencies**

```bash
cd /Users/jb/devtools/widget
npm init -y
npm install preact
npm install -D vite @preact/preset-vite typescript
```

**Step 4: Add build script to root package.json**

Add: `"build:widget": "cd widget && npx vite build"`

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: set up Vite + Preact widget build pipeline"
```

---

### Task 8: Floating Button + Tool Panel

**Files:**
- Create: `widget/src/toolbar/FloatingButton.tsx`
- Create: `widget/src/toolbar/ToolPanel.tsx`
- Create: `widget/src/toolbar/styles.ts`

**Step 1: Create floating button component**

Draggable circular button (bottom-right), click toggles tool panel. Renders a small blue circle with a wrench/code icon. Draggable via pointer events + translate.

**Step 2: Create tool panel**

Slide-out panel (right side) with list of available tools. Each tool is a button that toggles its view. Panel has a header with project name and close button.

**Step 3: Build and verify**

```bash
npm run build:widget
# Verify public/widget.js exists and is <100KB
ls -la public/widget.js
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add floating button and tool panel to widget"
```

---

### Task 9: Console Interceptor + Viewer

**Files:**
- Create: `widget/src/interceptors/console.ts`
- Create: `widget/src/tools/ConsoleViewer.tsx`

**Step 1: Create console interceptor**

Monkey-patch `console.log`, `console.warn`, `console.error`, `console.info`. Store entries in a circular buffer (max 500). Each entry: timestamp, level, args (serialized). Call original function after capturing.

**Step 2: Create console viewer component**

Scrollable list of console entries with level-colored badges (gray/yellow/red/blue). Filter by level. Clear button. Entries show timestamp + stringified args.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add console interceptor and viewer to widget"
```

---

### Task 10: Network Interceptor + Viewer

**Files:**
- Create: `widget/src/interceptors/network.ts`
- Create: `widget/src/tools/NetworkViewer.tsx`

**Step 1: Create network interceptor**

Monkey-patch `window.fetch` and `XMLHttpRequest.prototype.open/send`. Capture: method, URL, status, duration, request/response size, headers. Circular buffer (max 200).

**Step 2: Create network viewer component**

Table of requests: method badge (GET=green, POST=blue, etc.), URL (truncated), status (color-coded), duration. Click to expand full request/response details.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add network interceptor and viewer to widget"
```

---

### Task 11: Error Interceptor + Overlay + Bug Reporter

**Files:**
- Create: `widget/src/interceptors/errors.ts`
- Create: `widget/src/tools/ErrorOverlay.tsx`
- Create: `widget/src/tools/BugReporter.tsx`
- Create: `widget/src/api/client.ts`

**Step 1: Create error interceptor**

Listen to `window.onerror` and `window.addEventListener('unhandledrejection')`. Capture: message, stack trace, source file, line/col. Store in buffer. Trigger error overlay.

**Step 2: Create error overlay**

Auto-shows on uncaught error. Displays: error message, parsed stack trace (clickable frames), "Report Bug" button. Dismiss button to close.

**Step 3: Create bug reporter**

Form: title (pre-filled from error), description, severity selector. Captures: current URL, user agent, recent console errors, screenshot (via `html2canvas` or similar). Submits to `/api/bugs`.

**Step 4: Create API client**

```typescript
// widget/src/api/client.ts
export function createApiClient(apiBase: string, pinHash: string) {
  async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-DevTools-Pin': pinHash,
        ...options.headers,
      },
    })
    return res.json()
  }

  return {
    createBug: (data: Record<string, unknown>) =>
      request('/api/bugs', { method: 'POST', body: JSON.stringify(data) }),
    createDevLog: (data: Record<string, unknown>) =>
      request('/api/devlog', { method: 'POST', body: JSON.stringify(data) }),
    sendEvents: (events: unknown[]) =>
      request('/api/widget/event', { method: 'POST', body: JSON.stringify({ events }) }),
  }
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add error interceptor, overlay, bug reporter, and API client to widget"
```

---

## Phase 3: Dashboard Tools (Tasks 12-16)

### Task 12: API Tester

**Files:**
- Create: `src/app/(dashboard)/api-tester/page.tsx`
- Create: `src/components/request-builder.tsx`
- Create: `src/components/response-viewer.tsx`

Build an HTTP client: method selector (GET/POST/PUT/DELETE/PATCH), URL input, headers editor (key-value pairs), body editor (raw JSON), environment variable interpolation (`{{VAR}}`). Response: status, headers, body (pretty-printed JSON), timing. Save/load requests from Turso.

**Commit:** `feat: add API tester dashboard tool`

---

### Task 13: JSON Viewer

**Files:**
- Create: `src/app/(dashboard)/json/page.tsx`
- Create: `src/components/json-tree.tsx`

Features: paste JSON → tree view (collapsible), format/minify toggle, diff mode (two panes), path copy (click node → copy JSON path), search within JSON. Use a recursive tree component with expand/collapse state.

**Commit:** `feat: add JSON viewer dashboard tool`

---

### Task 14: Regex Tester

**Files:**
- Create: `src/app/(dashboard)/regex/page.tsx`

Features: pattern input with flags (g/i/m/s), test string textarea, live highlighting of matches, capture group display, match count, common patterns library (dropdown). Use native `RegExp` with try/catch for invalid patterns.

**Commit:** `feat: add regex tester dashboard tool`

---

### Task 15: Color / CSS Tools

**Files:**
- Create: `src/app/(dashboard)/colors/page.tsx`
- Create: `src/components/color-picker.tsx`

Features: color picker (hex/rgb/hsl), format converter, contrast checker (WCAG), gradient builder (CSS output), Tailwind color class lookup, box shadow generator. Use native `<input type="color">` + custom sliders.

**Commit:** `feat: add color and CSS tools dashboard page`

---

### Task 16: Env Var Manager

**Files:**
- Create: `src/app/(dashboard)/env/page.tsx`
- Create: `src/app/api/env/route.ts`

Features: list env vars per project (from `.env.example` scanning or manual entry), copy individual vars, compare across projects. Sensitive values masked by default (click to reveal). Stores in Turso `env_vars` table.

Note: This is a reference/documentation tool, NOT a deployment tool. For actual env deployment, use `/deploy-env` in Claude Code.

**Commit:** `feat: add env var manager dashboard tool`

---

## Phase 4: AI + Integrations (Tasks 17-19)

### Task 17: AI Analysis Endpoints

**Files:**
- Create: `src/app/api/ai/analyze/route.ts`
- Create: `src/app/api/ai/explain-error/route.ts`
- Install: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/google`

**Step 1: Install Vercel AI SDK**

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/google
```

**Step 2: Create analyze endpoint**

```typescript
// src/app/api/ai/analyze/route.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(request: Request) {
  const { text, context } = await request.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    system: 'You are a code analysis assistant. Explain the code, identify potential issues, and suggest improvements. Be concise.',
    prompt: `Analyze this code/text:\n\n${text}\n\nContext: ${context || 'none'}`,
  })

  return result.toDataStreamResponse()
}
```

**Step 3: Create explain-error endpoint**

Similar but with error-specific system prompt. Accepts error message + stack trace, returns plain-English explanation + fix suggestion.

**Step 4: Add QuickAI to widget**

Create `widget/src/tools/QuickAI.tsx` — listens for text selection, shows "Analyze" button on selection, sends to `/api/ai/analyze`, displays streaming response in a popup.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add AI analysis and error explanation endpoints with widget integration"
```

---

### Task 18: App Tracker Integration

**Files:**
- Create: `src/app/api/tracker/route.ts`
- Create: `src/app/(dashboard)/deployments/page.tsx`

**Step 1: Create tracker proxy API**

Query apps.jbcloud.app Supabase using service role key. Map DevTools project ID → App Tracker application by name or github_repo_name. Return recent deployments, build status, git commits.

**Step 2: Create deployments dashboard page**

Show recent deployments with: provider (Vercel/CF badge), environment, branch, status, commit, timestamp. Auto-refresh every 30s.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add App Tracker integration with deployments dashboard"
```

---

### Task 19: Widget Event Ingestion

**Files:**
- Create: `src/app/api/widget/event/route.ts`
- Create: `src/app/api/widget/config/[project]/route.ts`
- Create: `widget/src/interceptors/performance.ts`
- Modify: `widget/src/interceptors/index.ts`

**Step 1: Create event ingestion endpoint**

Accepts batched events from widget. Each event has: type, title, content, metadata. Inserts into devlog table with source='auto'.

**Step 2: Create widget config endpoint**

Returns widget configuration for a project (enabled tools, theme, position). Used by widget on init to configure itself.

**Step 3: Create performance interceptor**

Use `PerformanceObserver` to watch LCP, CLS, FID/INP. Report when thresholds exceeded (LCP > 2.5s, CLS > 0.1). Include in batched events.

**Step 4: Wire up event batching**

In widget entry point, set up 10-second interval + 20-event threshold for batch sending. Collect from all interceptors.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add widget event ingestion, config endpoint, and performance interceptor"
```

---

## Phase 5: Polish + Extras (Tasks 20-24)

### Task 20: Performance Dashboard

**Files:**
- Create: `src/app/(dashboard)/perf/page.tsx`

Display aggregated web vitals from devlog entries where type='perf'. Show: LCP/CLS/INP trend charts (last 7 days), current scores with color-coded badges (good/needs-improvement/poor), per-page breakdown.

**Commit:** `feat: add performance dashboard with web vitals trends`

---

### Task 21: Settings Pages

**Files:**
- Create: `src/app/(dashboard)/settings/projects/page.tsx`
- Create: `src/app/(dashboard)/settings/ai/page.tsx`
- Create: `src/app/(dashboard)/settings/widget/page.tsx`

**Projects:** List registered projects, add/edit/remove, show widget installation snippet.

**AI Config:** API key inputs (Claude, Gemini), model preference, test connection button.

**Widget Setup:** Per-project: enable/disable tools, theme (dark/light), position (corner selector), regenerate PIN hash.

**Commit:** `feat: add settings pages for projects, AI, and widget configuration`

---

### Task 22: Style Guide Page

**Files:**
- Create: `src/app/(dashboard)/style-guide/page.tsx`

Showcase all shadcn/ui components used in the project: buttons, cards, inputs, badges, dialogs, tabs, scroll areas. Include color swatches, typography scale, spacing examples. Same as `/new-project` style guide spec.

**Commit:** `feat: add style guide page`

---

### Task 23: Mobile App Mockup Page

**Files:**
- Create: `src/app/(dashboard)/mobile-app/page.tsx`

"Coming Soon" page with phone mockup showing DevTools mobile concept. Feature cards for: live dashboard, push notifications, bug triage, dev log reader. Email notification signup form (placeholder).

**Commit:** `feat: add mobile app companion mockup page`

---

### Task 24: Dev Button + Final Wiring

**Files:**
- Create: `src/components/dev-button.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

Floating dev button (development only) with dropdown menu linking to: Style Guide, Mobile App. Add to dashboard layout.

Update root `page.tsx` to show a proper dashboard overview: project count, recent bugs, recent devlog entries, deployment status.

**Commit:** `feat: add dev button and dashboard overview`

---

## Phase 6: Deployment (Tasks 25-27)

### Task 25: Turso Database Setup

**Step 1: Create Turso database**

```bash
turso db create devtools
turso db show devtools --url
turso db tokens create devtools
```

**Step 2: Store credentials in 1Password**

Use `store_api_key` MCP tool for TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.

**Step 3: Create .env.local.tpl**

```bash
TURSO_DATABASE_URL={{ op://Business/DevTools Turso/url }}
TURSO_AUTH_TOKEN={{ op://Business/DevTools Turso/authToken }}
DEVTOOLS_PIN_HASH={{ op://Business/DevTools/pinHash }}
ANTHROPIC_API_KEY={{ op://Business/Anthropic API Key/credential }}
```

**Step 4: Run migration**

```bash
npm run env:inject
npx drizzle-kit push
```

**Step 5: Commit**

```bash
git add .env.example .env.local.tpl
git commit -m "chore: add Turso database configuration"
```

---

### Task 26: Vercel Deployment

**Step 1: Create Vercel project**

```bash
cd /Users/jb/devtools
npx vercel
```

Link to Aventerica89 team, set project name to `devtools`.

**Step 2: Deploy env vars**

Use 1Password MCP `deploy_env_vars` or:

```bash
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add DEVTOOLS_PIN_HASH production
vercel env add ANTHROPIC_API_KEY production
```

**Step 3: Add custom domain**

```bash
vercel domains add devtools.jbcloud.app
```

**Step 4: Deploy**

```bash
vercel --prod
```

**Step 5: Verify**

```bash
curl -s -o /dev/null -w "%{http_code}" https://devtools.jbcloud.app/unlock
# Expected: 200
```

---

### Task 27: GitHub Repo + CI

**Step 1: Create GitHub repo**

```bash
gh repo create Aventerica89/devtools --public --source=. --remote=origin --push --description "Universal embeddable developer toolkit SDK"
gh repo edit Aventerica89/devtools --delete-branch-on-merge=true
```

**Step 2: Set up GitHub Actions (optional)**

Use `/setup-github-actions --preset node` for CI + Dependabot.

**Step 3: Sync to docs.jbcloud.app**

Use `/jbdocs` to publish project documentation.

---

## Phase 7: Integration Testing (Task 28)

### Task 28: End-to-End Integration Test

**Step 1: Test widget in VaporForge**

Add the `<script>` tag to VaporForge's landing page. Verify:
- Floating button appears
- Console viewer captures logs
- Network viewer shows requests
- Bug reporter submits to DevTools API
- AI analysis works on selected text

**Step 2: Test dashboard**

- PIN unlock works
- Bug tracker shows submitted bugs
- Dev log shows auto-captured events
- API tester sends requests
- Deployments show VaporForge deploys

**Step 3: Test widget in another project**

Add to `apps.jbcloud.app` to verify it works across different Next.js apps.

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1. Foundation | 1-6 | Scaffold, DB, auth, project CRUD, bug tracker, dev log |
| 2. Widget Core | 7-11 | Vite build, floating button, interceptors, bug reporter |
| 3. Dashboard Tools | 12-16 | API tester, JSON, regex, color, env vars |
| 4. AI + Integrations | 17-19 | AI endpoints, App Tracker, event ingestion |
| 5. Polish | 20-24 | Perf dashboard, settings, style guide, mobile mockup |
| 6. Deployment | 25-27 | Turso, Vercel, GitHub, CI |
| 7. Integration | 28 | E2E testing across projects |

**Total: 28 tasks across 7 phases.**

**MVP (shippable after Phase 2):** Dashboard with bug tracker + dev log, widget with floating button + interceptors + bug reporter. Everything else is incremental.
