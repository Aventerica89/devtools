# DevTools v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Widget v2 (11 tabs, copy system, command palette), Routines system, Hub page, and dashboard visual refresh.

**Architecture:** New Drizzle schema tables + Next.js API routes (Phase 1), then dashboard UI (Phases 2-4), then widget Preact components (Phases 5-7), then CSS density pass (Phase 8). Each phase is independently deployable.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Turso (libSQL), Zod, Preact 10 + Vite, Vitest, Tailwind v4, shadcn/ui, Lucide icons, Notion REST API

---
## Phase 1 — DB Schema + API Routes

### Task 1.1: Extend schema.ts with new tables

**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Add new columns to widgetConfig**

Inside the widgetConfig table definition, add:

```ts
  enabledTabs: text('enabled_tabs'),           // JSON array of tab IDs, null = all enabled
  screenshotFolder: text('screenshot_folder'), // nullable label for snapshot UI
```

**Step 2: Add Routines + Hub tables after envVars**

```ts
export const routineChecklists = sqliteTable('routineChecklists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const routineItems = sqliteTable('routineItems', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checklistId: integer('checklist_id').notNull().references(() => routineChecklists.id),
  name: text('name').notNull(),
  type: text('type').notNull().default('maintenance'),
  snippet: text('snippet'),
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const routineRuns = sqliteTable('routineRuns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  checklistId: integer('checklist_id').notNull().references(() => routineChecklists.id),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
})

export const routineRunItems = sqliteTable('routineRunItems', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').notNull().references(() => routineRuns.id),
  itemId: integer('item_id').notNull().references(() => routineItems.id),
  checked: integer('checked').notNull().default(0),
  checkedAt: text('checked_at'),
})

export const hubCache = sqliteTable(
  'hubCache',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    source: text('source').notNull(),   // 'notion' | 'plans'
    cacheKey: text('cache_key').notNull(),
    content: text('content').notNull(), // JSON blob
    fetchedAt: text('fetched_at').notNull(),
  },
  (t) => [uniqueIndex('hubCache_source_cacheKey_idx').on(t.source, t.cacheKey)]
)
```

**Step 3: Push schema to DB**

```bash
npm run db:push
```

Expected: Turso applies new columns and tables without data loss. Answer `y` for new tables only.

**Step 4: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat: add Routines + hubCache tables, widgetConfig enabledTabs/screenshotFolder columns"
```

---

### Task 1.2: Add Zod schemas to api.ts

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Write test for new schemas**

`src/app/api/__tests__/routines-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { RoutineChecklistSchema, RoutineItemSchema, RoutineRunCheckSchema } from '@/lib/api'

describe('RoutineChecklistSchema', () => {
  it('validates valid checklist', () => {
    const result = RoutineChecklistSchema.safeParse({ projectId: 'wp-jupiter', name: 'Weekly' })
    expect(result.success).toBe(true)
  })
  it('rejects missing projectId', () => {
    const result = RoutineChecklistSchema.safeParse({ name: 'Weekly' })
    expect(result.success).toBe(false)
  })
})

describe('RoutineItemSchema', () => {
  it('defaults type to maintenance', () => {
    const result = RoutineItemSchema.parse({ name: 'Check logs' })
    expect(result.type).toBe('maintenance')
  })
  it('rejects invalid type', () => {
    const result = RoutineItemSchema.safeParse({ name: 'Check', type: 'bogus' })
    expect(result.success).toBe(false)
  })
})

describe('RoutineRunCheckSchema', () => {
  it('accepts boolean', () => {
    expect(RoutineRunCheckSchema.parse({ checked: true })).toEqual({ checked: true })
  })
})
```

**Step 2: Run test — expect FAIL (schemas not defined yet)**

```bash
npm run test src/app/api/__tests__/routines-schema.test.ts
```

**Step 3: Add schemas to api.ts (after existing schemas)**

```ts
export const RoutineChecklistSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().optional(),
})

export const RoutineItemSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['health', 'maintenance', 'pre-deploy', 'workflow']).default('maintenance'),
  snippet: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  sortOrder: z.number().int().optional(),
})

export const RoutineRunCheckSchema = z.object({
  checked: z.boolean(),
})

export const HubKbQuerySchema = z.object({
  type: z.string().optional(),
  refresh: z.enum(['true', 'false']).optional(),
})
```

Also add to the existing WidgetConfigUpdateSchema:

```ts
  enabledTabs: z.array(z.string()).nullable().optional(),
  screenshotFolder: z.string().max(500).nullable().optional(),
```

**Step 4: Run tests — expect PASS**

```bash
npm run test src/app/api/__tests__/routines-schema.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/api.ts src/app/api/__tests__/routines-schema.test.ts
git commit -m "feat: add Routines + Hub Zod schemas to api.ts"
```

---

### Task 1.3: API route /api/routines (list + create checklists)

**Files:**
- Create: `src/app/api/routines/route.ts`
- Create: `src/app/api/__tests__/routines.test.ts`

**Step 1: Write failing test**

`src/app/api/__tests__/routines.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../routines/route'

const { mockDb } = vi.hoisted(() => {
  const mockDb = { select: vi.fn(), insert: vi.fn() }
  return { mockDb }
})
vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('@/lib/db/schema', () => ({ routineChecklists: {} }))
vi.mock('drizzle-orm', () => ({ eq: vi.fn((a, b) => ({ eq: a, val: b })) }))
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn().mockResolvedValue({ userId: 'user_1' }) }))

beforeEach(() => vi.clearAllMocks())

describe('GET /api/routines', () => {
  it('returns checklists for a project', async () => {
    const rows = [{ id: 1, projectId: 'wp-jupiter', name: 'Weekly' }]
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }),
    })
    const req = new Request('http://localhost/api/routines?projectId=wp-jupiter')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(rows)
  })
})

describe('POST /api/routines', () => {
  it('creates a checklist', async () => {
    const newRow = { id: 2, projectId: 'wp-jupiter', name: 'Daily', sortOrder: 0 }
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([newRow]) }),
    })
    const req = new Request('http://localhost/api/routines', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'wp-jupiter', name: 'Daily' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect((await res.json()).name).toBe('Daily')
  })
})
```

**Step 2: Run test — expect FAIL**

```bash
npm run test src/app/api/__tests__/routines.test.ts
```

**Step 3: Implement the route**

`src/app/api/routines/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineChecklists } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody, RoutineChecklistSchema } from '@/lib/api'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const query = db.select().from(routineChecklists)
  const rows = projectId
    ? await query.where(eq(routineChecklists.projectId, projectId))
    : await query
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const body = await parseBody(RoutineChecklistSchema, request)
  if (body instanceof NextResponse) return body
  const [row] = await db
    .insert(routineChecklists)
    .values({ ...body, sortOrder: body.sortOrder ?? 0 })
    .returning()
  return NextResponse.json(row, { status: 201 })
}
```

**Step 4: Run tests — expect PASS**

```bash
npm run test src/app/api/__tests__/routines.test.ts
```

**Step 5: Commit**

```bash
git add src/app/api/routines/route.ts src/app/api/__tests__/routines.test.ts
git commit -m "feat: GET + POST /api/routines for checklist list/create"
```

---

### Task 1.4: Checklist CRUD + items sub-route

**Files:**
- Create: `src/app/api/routines/[id]/route.ts`
- Create: `src/app/api/routines/[id]/items/route.ts`

**Step 1: Implement [id] CRUD**

`src/app/api/routines/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineChecklists } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody, RoutineChecklistSchema } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { id } = await params
  const [row] = await db.select().from(routineChecklists).where(eq(routineChecklists.id, Number(id)))
  if (!row) return apiError('Not found', 404)
  return NextResponse.json(row)
}

export async function PUT(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { id } = await params
  const body = await parseBody(RoutineChecklistSchema.partial(), request)
  if (body instanceof NextResponse) return body
  const [row] = await db
    .update(routineChecklists).set(body)
    .where(eq(routineChecklists.id, Number(id))).returning()
  if (!row) return apiError('Not found', 404)
  return NextResponse.json(row)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { id } = await params
  await db.delete(routineChecklists).where(eq(routineChecklists.id, Number(id)))
  return new NextResponse(null, { status: 204 })
}
```

**Step 2: Implement items sub-route**

`src/app/api/routines/[id]/items/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody, RoutineItemSchema } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { id } = await params
  const rows = await db.select().from(routineItems).where(eq(routineItems.checklistId, Number(id)))
  return NextResponse.json(rows)
}

export async function POST(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { id } = await params
  const body = await parseBody(RoutineItemSchema, request)
  if (body instanceof NextResponse) return body
  const [row] = await db
    .insert(routineItems)
    .values({ ...body, checklistId: Number(id), sortOrder: body.sortOrder ?? 0 })
    .returning()
  return NextResponse.json(row, { status: 201 })
}
```

**Step 3: Build check**

```bash
npm run build 2>&1 | grep -E "^Error|Type error" | head -10
```

**Step 4: Commit**

```bash
git add src/app/api/routines/[id]/route.ts src/app/api/routines/[id]/items/route.ts
git commit -m "feat: /api/routines/[id] CRUD + /api/routines/[id]/items routes"
```

---

### Task 1.5: Items CRUD + Runs lifecycle routes

**Files:**
- Create: `src/app/api/routines/items/[id]/route.ts`
- Create: `src/app/api/routines/[id]/runs/route.ts`
- Create: `src/app/api/routines/runs/[runId]/route.ts`
- Create: `src/app/api/routines/runs/[runId]/items/route.ts`

**Step 1: Item CRUD**

`src/app/api/routines/items/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody, RoutineItemSchema } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { id } = await params
  const body = await parseBody(RoutineItemSchema.partial(), request)
  if (body instanceof NextResponse) return body
  const [row] = await db
    .update(routineItems).set(body)
    .where(eq(routineItems.id, Number(id))).returning()
  if (!row) return apiError('Not found', 404)
  return NextResponse.json(row)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { id } = await params
  await db.delete(routineItems).where(eq(routineItems.id, Number(id)))
  return new NextResponse(null, { status: 204 })
}
```

**Step 2: Runs list + create (starts a new run + pre-populates run items)**

`src/app/api/routines/[id]/runs/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineChecklists, routineRuns, routineItems, routineRunItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { id } = await params
  const rows = await db.select().from(routineRuns).where(eq(routineRuns.checklistId, Number(id)))
  return NextResponse.json(rows)
}

export async function POST(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { id } = await params
  const checklistId = Number(id)

  const items = await db.select().from(routineItems).where(eq(routineItems.checklistId, checklistId))
  if (items.length === 0) return apiError('Checklist has no items', 400)

  const [checklist] = await db
    .select({ projectId: routineChecklists.projectId })
    .from(routineChecklists)
    .where(eq(routineChecklists.id, checklistId))
  if (!checklist) return apiError('Checklist not found', 404)

  const [run] = await db
    .insert(routineRuns)
    .values({ projectId: checklist.projectId, checklistId, startedAt: new Date().toISOString() })
    .returning()

  await db.insert(routineRunItems).values(
    items.map((item) => ({ runId: run.id, itemId: item.id, checked: 0 }))
  )
  return NextResponse.json(run, { status: 201 })
}
```

**Step 3: Run get + close**

`src/app/api/routines/runs/[runId]/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineRuns, routineRunItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError } from '@/lib/api'

type Params = { params: Promise<{ runId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { runId } = await params
  const [run] = await db.select().from(routineRuns).where(eq(routineRuns.id, Number(runId)))
  if (!run) return apiError('Not found', 404)
  const items = await db.select().from(routineRunItems).where(eq(routineRunItems.runId, Number(runId)))
  return NextResponse.json({ ...run, items })
}

export async function PUT(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { runId } = await params
  const body = await request.json().catch(() => ({}))
  const completedAt = body.close ? new Date().toISOString() : null
  const [run] = await db
    .update(routineRuns).set({ completedAt })
    .where(eq(routineRuns.id, Number(runId))).returning()
  return NextResponse.json(run)
}
```

**Step 4: Check/uncheck run item**

`src/app/api/routines/runs/[runId]/items/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { routineRunItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiError, parseBody, RoutineRunCheckSchema } from '@/lib/api'

type Params = { params: Promise<{ runId: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  const { runId } = await params
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')
  if (!itemId) return apiError('itemId required', 400)
  const body = await parseBody(RoutineRunCheckSchema, request)
  if (body instanceof NextResponse) return body
  const [row] = await db
    .update(routineRunItems)
    .set({ checked: body.checked ? 1 : 0, checkedAt: body.checked ? new Date().toISOString() : null })
    .where(and(eq(routineRunItems.runId, Number(runId)), eq(routineRunItems.itemId, Number(itemId))))
    .returning()
  return NextResponse.json(row)
}
```

**Step 5: Build check**

```bash
npm run build 2>&1 | grep -E "^Error|Type error" | head -10
```

**Step 6: Commit**

```bash
git add src/app/api/routines/items/[id]/route.ts src/app/api/routines/[id]/runs/route.ts src/app/api/routines/runs/[runId]/route.ts src/app/api/routines/runs/[runId]/items/route.ts
git commit -m "feat: full Routines runs API (create/check/close run lifecycle)"
```

---

### Task 1.6: Hub API routes

**Files:**
- Create: `src/app/api/hub/kb/route.ts`
- Create: `src/app/api/hub/plans/route.ts`

**Step 1: Notion KB cache route**

`src/app/api/hub/kb/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { hubCache } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { apiError } from '@/lib/api'

const NOTION_DB_ID = '885cd9c275bd45bb93e17fe0f156d1b1'
const TTL_MS = 60 * 60 * 1000 // 1 hour

async function fetchNotionPages(token: string) {
  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ page_size: 100 }),
  })
  if (!res.ok) throw new Error(`Notion API error: ${res.status}`)
  return ((await res.json()).results ?? []) as Record<string, unknown>[]
}

function pageToEntry(page: Record<string, unknown>) {
  const props = page.properties as Record<string, Record<string, unknown>>
  const titleProp = props?.Name ?? props?.Title ?? {}
  const titleArr = (titleProp.title as Array<{ plain_text: string }>) ?? []
  const title = titleArr.map((t) => t.plain_text).join('') || 'Untitled'
  const type = (props?.Type?.select as { name?: string } | null)?.name ?? ''
  const snippet = ((props?.Snippet?.rich_text as Array<{ plain_text: string }>) ?? [])
    .map((t) => t.plain_text).join('')
  const description = ((props?.Description?.rich_text as Array<{ plain_text: string }>) ?? [])
    .map((t) => t.plain_text).join('')
  return { id: page.id as string, title, type, snippet, description, lastEdited: page.last_edited_time as string }
}

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const typeFilter = searchParams.get('type')
  const forceRefresh = searchParams.get('refresh') === 'true'
  const token = process.env.NOTION_API_TOKEN
  if (!token) return apiError('NOTION_API_TOKEN not configured', 503)

  if (!forceRefresh) {
    const [cached] = await db.select().from(hubCache)
      .where(and(eq(hubCache.source, 'notion'), eq(hubCache.cacheKey, 'all')))
    if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < TTL_MS) {
      let entries = JSON.parse(cached.content)
      if (typeFilter) entries = entries.filter((e: { type: string }) => e.type === typeFilter)
      return NextResponse.json(entries)
    }
  }

  const pages = await fetchNotionPages(token)
  const entries = pages.map(pageToEntry)
  const content = JSON.stringify(entries)
  const fetchedAt = new Date().toISOString()

  const [existing] = await db.select({ id: hubCache.id }).from(hubCache)
    .where(and(eq(hubCache.source, 'notion'), eq(hubCache.cacheKey, 'all')))
  if (existing) {
    await db.update(hubCache).set({ content, fetchedAt }).where(eq(hubCache.id, existing.id))
  } else {
    await db.insert(hubCache).values({ source: 'notion', cacheKey: 'all', content, fetchedAt })
  }

  const result = typeFilter ? entries.filter((e) => e.type === typeFilter) : entries
  return NextResponse.json(result)
}
```

**Step 2: Plans index route (dev only)**

`src/app/api/hub/plans/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { apiError } from '@/lib/api'
import fs from 'fs/promises'
import path from 'path'

function parsePlansHtml(html: string) {
  const rows: { title: string; project: string; status: string; date: string }[] = []
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const cells: string[] = []
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let cellMatch
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim())
    }
    if (cells.length >= 4) {
      rows.push({ title: cells[0], project: cells[1], status: cells[2], date: cells[3] })
    }
  }
  return rows
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return apiError('Unauthorized', 401)
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ available: false })
  try {
    const filePath = path.join(process.env.HOME ?? '~', 'Desktop', 'plans-index.html')
    const html = await fs.readFile(filePath, 'utf-8')
    return NextResponse.json({ available: true, plans: parsePlansHtml(html) })
  } catch {
    return NextResponse.json({ available: false, reason: 'File not found' })
  }
}
```

**Step 3: Build check + commit**

```bash
npm run build 2>&1 | grep -E "^Error|Type error" | head -10
git add src/app/api/hub/kb/route.ts src/app/api/hub/plans/route.ts
git commit -m "feat: /api/hub/kb (Notion cache, 1h TTL) and /api/hub/plans (dev-only local file)"
```

---
## Phase 2 — Routines Dashboard Page

### Task 2.1: Routines page shell + sidebar entry

**Files:**
- Create: `src/app/(dashboard)/routines/page.tsx`
- Create: `src/app/(dashboard)/routines/routines-client.tsx`
- Modify: `src/components/sidebar.tsx`

**Step 1: Add Resources section to sidebar**

In `src/components/sidebar.tsx`:

1. Add imports: `import { Library, ListChecks } from 'lucide-react'`
2. Add "Resources" section at the TOP of the sections array (before "Overview"):

```ts
{
  label: 'Resources',
  items: [
    { href: '/hub', label: 'Hub', icon: Library, roles: OWNER_DEV },
    { href: '/routines', label: 'Routines', icon: ListChecks, roles: OWNER_DEV },
  ],
},
```

**Step 2: Create Routines page + client placeholder**

`src/app/(dashboard)/routines/page.tsx`:
```tsx
import { RoutinesClient } from './routines-client'
export const metadata = { title: 'Routines — DevTools' }
export default function RoutinesPage() { return <RoutinesClient /> }
```

`src/app/(dashboard)/routines/routines-client.tsx`:
```tsx
'use client'
export function RoutinesClient() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Routines</h1>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  )
}
```

**Step 3: Dev server check**

```bash
npm run dev
```

Navigate to `http://localhost:3000/routines`. Expected: page renders with "Routines" heading. Sidebar shows "Resources" section.

**Step 4: Commit**

```bash
git add src/app/(dashboard)/routines/ src/components/sidebar.tsx
git commit -m "feat: Routines page shell + Resources sidebar section"
```

---

### Task 2.2: Routines two-panel layout — project selector + checklist list

**Files:**
- Modify: `src/app/(dashboard)/routines/routines-client.tsx`

**Step 1: Replace placeholder with full layout**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import { ChecklistEditor } from './checklist-editor'

interface Project { id: string; name: string }
interface Checklist { id: number; projectId: string; name: string; description?: string | null; sortOrder: number }

export function RoutinesClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects').then((r) => r.json()).then((data: Project[]) => {
      setProjects(data)
      if (data.length > 0) setSelectedProject(data[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedProject) return
    setSelectedChecklist(null)
    fetch(`/api/routines?projectId=${selectedProject}`).then((r) => r.json()).then(setChecklists)
  }, [selectedProject])

  async function createChecklist() {
    const name = prompt('Checklist name:')
    if (!name || !selectedProject) return
    const res = await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProject, name }),
    })
    if (res.ok) {
      const row: Checklist = await res.json()
      setChecklists((prev) => [...prev, row])
      setSelectedChecklist(row)
    }
  }

  async function deleteChecklist(id: number) {
    if (!confirm('Delete this checklist and all its items?')) return
    await fetch(`/api/routines/${id}`, { method: 'DELETE' })
    setChecklists((prev) => prev.filter((c) => c.id !== id))
    if (selectedChecklist?.id === id) setSelectedChecklist(null)
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <select
            className="w-full text-sm bg-background border border-border rounded px-2 py-1"
            value={selectedProject ?? ''}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {checklists.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm group ${
                selectedChecklist?.id === c.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
              onClick={() => setSelectedChecklist(c)}
            >
              <span className="flex items-center gap-1 min-w-0 truncate">
                <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />{c.name}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 text-destructive shrink-0 ml-1"
                onClick={(e) => { e.stopPropagation(); deleteChecklist(c.id) }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {checklists.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No checklists yet</p>}
        </div>
        <div className="p-3 border-t border-border">
          <Button size="sm" variant="outline" className="w-full" onClick={createChecklist}>
            <Plus className="h-3 w-3 mr-1" /> New Checklist
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {selectedChecklist ? (
          <ChecklistEditor checklist={selectedChecklist} onUpdate={(c) => {
            setChecklists((prev) => prev.map((x) => x.id === c.id ? c : x))
            setSelectedChecklist(c)
          }} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Select a checklist or create one
          </div>
        )}
      </div>
    </div>
  )
}
```

Note: `ChecklistEditor` is imported but not yet created — create it in Task 2.3 first if doing strict TDD, or create a stub.

**Step 2: Commit**

```bash
git add src/app/(dashboard)/routines/routines-client.tsx
git commit -m "feat: Routines two-panel layout — project selector + checklist list"
```

---

### Task 2.3: ChecklistEditor — items CRUD + run history

**Files:**
- Create: `src/app/(dashboard)/routines/checklist-editor.tsx`

**Step 1: Create the component**

`src/app/(dashboard)/routines/checklist-editor.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Play, ChevronDown, ChevronRight, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Checklist { id: number; name: string; description?: string | null }
interface Item { id: number; checklistId: number; name: string; type: string; snippet?: string | null; notes?: string | null; sortOrder: number }
interface RunItem { id: number; itemId: number; checked: number; checkedAt?: string | null }
interface Run { id: number; checklistId: number; startedAt: string; completedAt?: string | null; items?: RunItem[] }

const TYPE_COLORS: Record<string, string> = {
  health: 'bg-emerald-500/15 text-emerald-400',
  maintenance: 'bg-blue-500/15 text-blue-400',
  'pre-deploy': 'bg-orange-500/15 text-orange-400',
  workflow: 'bg-purple-500/15 text-purple-400',
}

interface Props { checklist: Checklist; onUpdate: (c: Checklist) => void }

export function ChecklistEditor({ checklist }: Props) {
  const [activeTab, setActiveTab] = useState<'items' | 'history'>('items')
  const [items, setItems] = useState<Item[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [expandedRun, setExpandedRun] = useState<number | null>(null)
  const [expandedRunData, setExpandedRunData] = useState<Record<number, Run>>({})

  useEffect(() => {
    fetch(`/api/routines/${checklist.id}/items`).then((r) => r.json()).then(setItems)
    fetch(`/api/routines/${checklist.id}/runs`).then((r) => r.json()).then(setRuns)
  }, [checklist.id])

  async function addItem() {
    const name = prompt('Item name:')
    if (!name) return
    const res = await fetch(`/api/routines/${checklist.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sortOrder: items.length }),
    })
    if (res.ok) setItems((prev) => [...prev, await res.json()])
  }

  async function deleteItem(id: number) {
    await fetch(`/api/routines/items/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function startRun() {
    const res = await fetch(`/api/routines/${checklist.id}/runs`, { method: 'POST' })
    if (res.ok) {
      const run: Run = await res.json()
      setRuns((prev) => [run, ...prev])
      setActiveTab('history')
    }
  }

  async function expandRun(runId: number) {
    if (expandedRun === runId) { setExpandedRun(null); return }
    setExpandedRun(runId)
    if (!expandedRunData[runId]) {
      const data: Run = await fetch(`/api/routines/runs/${runId}`).then((r) => r.json())
      setExpandedRunData((prev) => ({ ...prev, [runId]: data }))
    }
  }

  async function toggleRunItem(runId: number, itemId: number, checked: boolean) {
    await fetch(`/api/routines/runs/${runId}/items?itemId=${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked }),
    })
    setExpandedRunData((prev) => ({
      ...prev,
      [runId]: {
        ...prev[runId],
        items: prev[runId]?.items?.map((i) =>
          i.itemId === itemId ? { ...i, checked: checked ? 1 : 0 } : i
        ),
      },
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{checklist.name}</h2>
        <Button size="sm" onClick={startRun}><Play className="h-3 w-3 mr-1" /> Start Run</Button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['items', 'history'] as const).map((tab) => (
          <button key={tab}
            className={cn('px-4 py-2 text-sm capitalize', activeTab === tab
              ? 'border-b-2 border-foreground text-foreground'
              : 'text-muted-foreground hover:text-foreground')}
            onClick={() => setActiveTab(tab)}
          >{tab}</button>
        ))}
      </div>

      {activeTab === 'items' && (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="border border-border rounded-md p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  <Badge className={cn('text-xs shrink-0', TYPE_COLORS[item.type] ?? '')} variant="outline">
                    {item.type}
                  </Badge>
                </div>
                <button onClick={() => deleteItem(item.id)}>
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              {item.snippet && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono truncate">{item.snippet}</code>
                  <button onClick={() => navigator.clipboard.writeText(item.snippet ?? '')}>
                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
              {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
          <Button size="sm" variant="outline" onClick={addItem} className="self-start">
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex flex-col gap-2">
          {runs.map((run) => {
            const runData = expandedRunData[run.id]
            const total = runData?.items?.length ?? 0
            const checked = runData?.items?.filter((i) => i.checked).length ?? 0
            return (
              <div key={run.id} className="border border-border rounded-md overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50"
                  onClick={() => expandRun(run.id)}
                >
                  <div className="flex items-center gap-3 text-sm">
                    {expandedRun === run.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span>{new Date(run.startedAt).toLocaleString()}</span>
                    {run.completedAt && <Badge variant="outline" className="text-xs text-emerald-400">Complete</Badge>}
                  </div>
                  {runData && <span className="text-xs text-muted-foreground">{checked}/{total}</span>}
                </button>
                {expandedRun === run.id && runData?.items && (
                  <div className="border-t border-border p-3 flex flex-col gap-2">
                    {runData.items.map((runItem) => {
                      const item = items.find((i) => i.id === runItem.itemId)
                      return (
                        <div key={runItem.id} className="flex items-center gap-3 text-sm">
                          <input type="checkbox" checked={runItem.checked === 1}
                            onChange={(e) => toggleRunItem(run.id, runItem.itemId, e.target.checked)} />
                          <span className={runItem.checked ? 'line-through text-muted-foreground' : ''}>
                            {item?.name ?? `Item ${runItem.itemId}`}
                          </span>
                          {runItem.checkedAt && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(runItem.checkedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {runs.length === 0 && <p className="text-sm text-muted-foreground">No runs yet. Click Start Run.</p>}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Dev server smoke test**

```bash
npm run dev
```

- Create a checklist
- Add items (try type=health, add a snippet)
- Start a run, check items
- Verify run history shows

**Step 3: Commit**

```bash
git add src/app/(dashboard)/routines/checklist-editor.tsx
git commit -m "feat: ChecklistEditor — items CRUD + run history with live check-off"
```

---
## Phase 3 — Hub Page

### Task 3.1: Hub page shell + stats strip

**Files:**
- Create: `src/app/(dashboard)/hub/page.tsx`
- Create: `src/app/(dashboard)/hub/hub-client.tsx`

**Step 1: Create Hub page**

`src/app/(dashboard)/hub/page.tsx`:
```tsx
import { HubClient } from './hub-client'
export const metadata = { title: 'Hub — DevTools' }
export default function HubPage() { return <HubClient /> }
```

**Step 2: Create HubClient with stats strip + two-column grid**

`src/app/(dashboard)/hub/hub-client.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { NotionPanel } from './notion-panel'
import { PlansPanel } from './plans-panel'

export function HubClient() {
  const [openBugs, setOpenBugs] = useState(0)
  const [kbCount, setKbCount] = useState(0)

  useEffect(() => {
    fetch('/api/bugs?status=open&limit=500').then((r) => r.json())
      .then((d) => setOpenBugs(Array.isArray(d) ? d.length : 0))
    fetch('/api/hub/kb').then((r) => r.json())
      .then((d) => setKbCount(Array.isArray(d) ? d.length : 0))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Bugs', value: openBugs },
          { label: 'KB Entries', value: kbCount },
        ].map((s) => (
          <div key={s.label} className="border border-border rounded-md p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold font-mono">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotionPanel />
        <PlansPanel />
      </div>
    </div>
  )
}
```

**Step 3: Commit shell**

```bash
git add src/app/(dashboard)/hub/page.tsx src/app/(dashboard)/hub/hub-client.tsx
git commit -m "feat: Hub page shell with stats strip"
```

---

### Task 3.2: NotionPanel

**Files:**
- Create: `src/app/(dashboard)/hub/notion-panel.tsx`

**Step 1: Implement NotionPanel**

`src/app/(dashboard)/hub/notion-panel.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KbEntry { id: string; title: string; type: string; description?: string; snippet?: string }

const TYPE_COLORS: Record<string, string> = {
  Standards: 'bg-blue-500/15 text-blue-400',
  Git: 'bg-orange-500/15 text-orange-400',
  API: 'bg-purple-500/15 text-purple-400',
  Deploy: 'bg-emerald-500/15 text-emerald-400',
}

export function NotionPanel() {
  const [entries, setEntries] = useState<KbEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<KbEntry | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load(refresh = false) {
    setLoading(true)
    const data = await fetch(`/api/hub/kb${refresh ? '?refresh=true' : ''}`).then((r) => r.json())
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  const filtered = entries.filter((e) =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.type.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="border border-border rounded-md flex flex-col relative" style={{ minHeight: 400 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Knowledge Base</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6"
          onClick={() => { setRefreshing(true); load(true) }} disabled={refreshing}>
          <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
        </Button>
      </div>
      <div className="px-4 py-2 border-b border-border">
        <input placeholder="Search..." value={search}
          className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)} />
      </div>
      <div className="flex-1 overflow-auto">
        {loading && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
        {!loading && filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">No entries found.</p>}
        {filtered.map((entry) => (
          <div key={entry.id}
            className="flex items-start justify-between px-4 py-3 border-b border-border hover:bg-accent/30 cursor-pointer"
            onClick={() => setSelected(entry)}>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium truncate">{entry.title}</span>
              {entry.description && <span className="text-xs text-muted-foreground truncate">{entry.description}</span>}
            </div>
            <Badge className={cn('text-xs shrink-0 ml-2', TYPE_COLORS[entry.type] ?? '')} variant="outline">
              {entry.type}
            </Badge>
          </div>
        ))}
      </div>
      {selected && (
        <div className="absolute inset-0 bg-background/95 z-10 flex flex-col p-6 overflow-auto rounded-md">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-base font-semibold">{selected.title}</h3>
            <button onClick={() => setSelected(null)}><X className="h-4 w-4" /></button>
          </div>
          {selected.description && <p className="text-sm text-muted-foreground mb-4">{selected.description}</p>}
          {selected.snippet && (
            <pre className="text-xs bg-muted p-4 rounded font-mono whitespace-pre-wrap">{selected.snippet}</pre>
          )}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/hub/notion-panel.tsx
git commit -m "feat: Hub NotionPanel — searchable KB cards with refresh + detail modal"
```

---

### Task 3.3: PlansPanel

**Files:**
- Create: `src/app/(dashboard)/hub/plans-panel.tsx`

**Step 1: Implement**

`src/app/(dashboard)/hub/plans-panel.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface Plan { title: string; project: string; status: string; date: string }
const STATUS_COLORS: Record<string, string> = {
  Approved: 'bg-emerald-500/15 text-emerald-400',
  Draft: 'bg-yellow-500/15 text-yellow-400',
  Complete: 'bg-blue-500/15 text-blue-400',
}

export function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [available, setAvailable] = useState<boolean | null>(null)
  const [reason, setReason] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/hub/plans').then((r) => r.json()).then((data) => {
      setAvailable(data.available)
      setReason(data.reason ?? null)
      if (data.available) setPlans(data.plans ?? [])
    })
  }, [])

  return (
    <div className="border border-border rounded-md flex flex-col" style={{ minHeight: 400 }}>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Plans Index</h2>
      </div>
      <div className="flex-1 overflow-auto">
        {available === null && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
        {available === false && (
          <div className="p-4 text-sm text-muted-foreground">
            <p>Local file — not available in production.</p>
            {reason && <p className="text-xs mt-1 opacity-60">{reason}</p>}
          </div>
        )}
        {available && plans.map((plan, i) => (
          <div key={i} className="flex items-start justify-between px-4 py-3 border-b border-border">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium truncate">{plan.title}</span>
              <span className="text-xs text-muted-foreground">{plan.project} · {plan.date}</span>
            </div>
            <Badge className={`text-xs shrink-0 ml-2 ${STATUS_COLORS[plan.status] ?? 'text-muted-foreground'}`} variant="outline">
              {plan.status}
            </Badge>
          </div>
        ))}
        {available && plans.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No plans found in ~/Desktop/plans-index.html</p>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Dev server smoke test**

```bash
npm run dev
```

Navigate to `/hub`. Both panels should render. Notion panel shows KB entries (requires `NOTION_API_TOKEN` in `.env.local`).

**Step 3: Commit**

```bash
git add src/app/(dashboard)/hub/plans-panel.tsx
git commit -m "feat: Hub PlansPanel — local dev plans index with production fallback"
```

---
## Phase 4 — Command Palette

### Task 4.1: Dashboard ⌘K command palette

**Files:**
- Create: `src/components/command-palette.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: Create CommandPalette component**

`src/components/command-palette.tsx`:

```tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { Copy, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KbEntry { id: string; title: string; type: string; snippet?: string; description?: string }
const FILTERS = ['All', 'Standards', 'Git', 'API', 'Deploy'] as const

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [entries, setEntries] = useState<KbEntry[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      fetch('/api/hub/kb').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setEntries(d) })
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setFilter('All')
    }
  }, [open])

  function copySnippet(entry: KbEntry) {
    navigator.clipboard.writeText(entry.snippet ?? entry.title)
    setCopied(entry.id)
    setTimeout(() => setCopied(null), 1500)
  }

  const filtered = entries.filter((e) => {
    const matchFilter = filter === 'All' || e.type === filter
    const matchQuery = !query ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      (e.snippet ?? '').toLowerCase().includes(query.toLowerCase())
    return matchFilter && matchQuery
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-background/80 backdrop-blur-sm"
      onClick={() => setOpen(false)}>
      <div className="w-full max-w-2xl bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <input ref={inputRef} value={query}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search knowledge base..."
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)} />
          <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="flex gap-1 px-4 py-2 border-b border-border">
          {FILTERS.map((f) => (
            <button key={f}
              className={cn('px-3 py-1 text-xs rounded-full', filter === f
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50')}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="max-h-96 overflow-auto">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-sm text-center text-muted-foreground">No results</p>
          )}
          {filtered.map((entry) => (
            <div key={entry.id}
              className="flex items-start justify-between px-4 py-3 hover:bg-accent/30 group">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-medium">{entry.title}</span>
                {entry.description && <span className="text-xs text-muted-foreground">{entry.description}</span>}
                {entry.snippet && (
                  <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono truncate max-w-sm">{entry.snippet}</code>
                )}
              </div>
              {entry.snippet && (
                <button className="ml-3 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => copySnippet(entry)}>
                  <Copy className={cn('h-4 w-4', copied === entry.id ? 'text-emerald-400' : 'text-muted-foreground')} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Add to dashboard layout**

In `src/app/(dashboard)/layout.tsx`, add:

```tsx
import { CommandPalette } from '@/components/command-palette'
```

And inside the layout JSX (after or alongside main content):

```tsx
<CommandPalette />
```

**Step 3: Dev server check**

```bash
npm run dev
```

Press `⌘K` in the dashboard. Expected: overlay opens with search input and filter chips.

**Step 4: Commit**

```bash
git add src/components/command-palette.tsx src/app/(dashboard)/layout.tsx
git commit -m "feat: dashboard ⌘K command palette with KB search + category filter chips"
```

---

### Task 4.2: Widget ⌘⇧K Shadow DOM command palette

**Files:**
- Create: `widget/src/tools/CommandPalette.tsx`
- Modify: `widget/src/index.ts`

**Step 1: Create widget command palette**

`widget/src/tools/CommandPalette.tsx`:

```tsx
import { h } from 'preact'
import { useState, useEffect, useRef } from 'preact/hooks'
import { COLORS } from '../toolbar/styles'

interface KbEntry { id: string; title: string; type: string; snippet?: string; description?: string }
const FILTERS = ['All', 'Standards', 'Git', 'API', 'Deploy'] as const

interface Props { apiBase: string; pinHash: string; onClose: () => void }

export function CommandPalette({ apiBase, pinHash, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [entries, setEntries] = useState<KbEntry[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${apiBase}/api/hub/kb`, { headers: { 'X-DevTools-Pin': pinHash } })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setEntries(d) })
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [apiBase, pinHash])

  function copy(entry: KbEntry) {
    navigator.clipboard.writeText(entry.snippet ?? entry.title)
    setCopied(entry.id)
    setTimeout(() => setCopied(null), 1500)
  }

  const filtered = entries.filter((e) => {
    const matchFilter = filter === 'All' || e.type === filter
    const matchQuery = !query ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      (e.snippet ?? '').toLowerCase().includes(query.toLowerCase())
    return matchFilter && matchQuery
  })

  return h('div', {
    style: { position: 'fixed', inset: 0, zIndex: 2147483647, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 96 },
    onClick: onClose,
  },
    h('div', {
      style: { width: '100%', maxWidth: 600, background: COLORS.panelBg, border: `1px solid ${COLORS.panelBorder}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', fontFamily: 'system-ui,sans-serif' },
      onClick: (e: MouseEvent) => e.stopPropagation(),
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
        h('input', { ref: inputRef, value: query,
          style: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: COLORS.text, fontSize: 13, fontFamily: 'inherit' },
          placeholder: 'Search knowledge base...',
          onInput: (e: Event) => setQuery((e.target as HTMLInputElement).value) }),
        h('button', { style: { background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 16 }, onClick: onClose }, '✕')
      ),
      h('div', { style: { display: 'flex', gap: 4, padding: '6px 10px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
        FILTERS.map((f) =>
          h('button', { key: f,
            style: { padding: '2px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
              background: filter === f ? COLORS.toolBtnBgActive : COLORS.toolBtnBg,
              color: filter === f ? '#fff' : COLORS.textMuted },
            onClick: () => setFilter(f) }, f)
        )
      ),
      h('div', { style: { maxHeight: 360, overflowY: 'auto' } },
        filtered.length === 0
          ? h('p', { style: { padding: '24px 14px', textAlign: 'center', color: COLORS.textMuted, fontSize: 12 } }, 'No results')
          : filtered.map((entry) =>
            h('div', { key: entry.id, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 14px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 } },
                h('span', { style: { fontSize: 12, color: COLORS.text, fontWeight: 500 } }, entry.title),
                entry.description && h('span', { style: { fontSize: 10, color: COLORS.textMuted } }, entry.description),
                entry.snippet && h('code', { style: { fontSize: 10, background: '#0a0f1a', color: '#94a3b8', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, entry.snippet)
              ),
              entry.snippet && h('button', {
                style: { background: 'none', border: 'none', cursor: 'pointer', color: copied === entry.id ? '#34d399' : COLORS.textMuted, fontSize: 14, marginLeft: 8, flexShrink: 0 },
                onClick: () => copy(entry) }, '⧉')
            )
          )
      )
    )
  )
}
```

**Step 2: Wire ⌘⇧K in widget index**

In `widget/src/index.ts`, add import:

```ts
import { h, render } from 'preact'
import { CommandPalette } from './tools/CommandPalette'
```

After `initInterceptors(...)`, add keyboard listener:

```ts
let cmdPaletteMount: HTMLElement | null = null

document.addEventListener('keydown', (e) => {
  if (e.key === 'K' && e.metaKey && e.shiftKey) {
    e.preventDefault()
    if (cmdPaletteMount) {
      shadowRoot.removeChild(cmdPaletteMount)
      cmdPaletteMount = null
    } else {
      cmdPaletteMount = document.createElement('div')
      shadowRoot.appendChild(cmdPaletteMount)
      render(
        h(CommandPalette, { apiBase, pinHash, onClose: () => {
          if (cmdPaletteMount) { shadowRoot.removeChild(cmdPaletteMount); cmdPaletteMount = null }
        }}),
        cmdPaletteMount
      )
    }
  }
})
```

**Step 3: Build widget**

```bash
npm run build:widget 2>&1 | tail -10
```

**Step 4: Commit**

```bash
git add widget/src/tools/CommandPalette.tsx widget/src/index.ts
git commit -m "feat: widget ⌘⇧K Shadow DOM command palette"
```

---
## Phase 5 — Widget New Tabs + Snapshot v2 Fixes

### Task 5.1: Storage interceptor + StorageViewer tab

**Files:**
- Create: `widget/src/interceptors/storage.ts`
- Create: `widget/src/tools/StorageViewer.tsx`
- Modify: `widget/src/toolbar/ToolPanel.tsx`

**Step 1: Create storage interceptor**

`widget/src/interceptors/storage.ts`:

```ts
export interface StorageSnapshot {
  localStorage: Record<string, string>
  sessionStorage: Record<string, string>
  cookies: string
}

let snapshot: StorageSnapshot = { localStorage: {}, sessionStorage: {}, cookies: '' }

export function captureStorage(): StorageSnapshot {
  const ls: Record<string, string> = {}
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)!
    ls[k] = window.localStorage.getItem(k) ?? ''
  }
  const ss: Record<string, string> = {}
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i)!
    ss[k] = window.sessionStorage.getItem(k) ?? ''
  }
  snapshot = { localStorage: ls, sessionStorage: ss, cookies: document.cookie }
  return snapshot
}

export function getStorageSnapshot(): StorageSnapshot { return snapshot }
```

**Step 2: Create StorageViewer**

`widget/src/tools/StorageViewer.tsx`:

```tsx
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { captureStorage, type StorageSnapshot } from '../interceptors/storage'
import { COLORS } from '../toolbar/styles'

export function StorageViewer() {
  const [data, setData] = useState<StorageSnapshot>({ localStorage: {}, sessionStorage: {}, cookies: '' })
  const [tab, setTab] = useState<'ls' | 'ss' | 'cookies'>('ls')

  useEffect(() => { setData(captureStorage()) }, [])

  const tabBtn = (id: 'ls' | 'ss' | 'cookies', label: string) => h('button', {
    style: { padding: '4px 10px', fontSize: 11, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
      background: tab === id ? COLORS.toolBtnBgActive : 'transparent',
      color: tab === id ? '#fff' : COLORS.textMuted, borderRadius: 4 },
    onClick: () => setTab(id),
  }, label)

  const source = tab === 'ls' ? data.localStorage : tab === 'ss' ? data.sessionStorage : null
  const entries = source ? Object.entries(source) : []

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    h('div', { style: { display: 'flex', gap: 4, padding: '6px 8px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
      tabBtn('ls', 'localStorage'),
      tabBtn('ss', 'sessionStorage'),
      tabBtn('cookies', 'Cookies'),
    ),
    h('div', { style: { flex: 1, overflowY: 'auto' } },
      tab === 'cookies'
        ? h('pre', { style: { padding: 12, fontSize: 10, color: COLORS.text, fontFamily: 'monospace', whiteSpace: 'pre-wrap' } }, data.cookies || '(empty)')
        : entries.length === 0
          ? h('p', { style: { padding: 12, fontSize: 11, color: COLORS.textMuted } }, '(empty)')
          : entries.map(([k, v]) =>
            h('div', { key: k, style: { display: 'flex', gap: 8, padding: '4px 12px', borderBottom: `1px solid ${COLORS.panelBorder}`, fontSize: 11 } },
              h('span', { style: { color: COLORS.textMuted, flexShrink: 0, width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, k),
              h('span', { style: { color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' } }, v)
            )
          )
    )
  )
}
```

**Step 3: Add to ToolPanel.tsx**

1. Import: `import { StorageViewer } from '../tools/StorageViewer'`
2. Add to TOOLS array: `{ id: 'storage', label: 'Storage', icon: '\u{1F5C4}' }`
3. Add to stretch condition: add `|| activeTool === 'storage'`
4. Add to render chain: `: activeTool === 'storage' ? h(StorageViewer, null)`

**Step 4: Build widget**

```bash
npm run build:widget 2>&1 | tail -10
```

**Step 5: Commit**

```bash
git add widget/src/interceptors/storage.ts widget/src/tools/StorageViewer.tsx widget/src/toolbar/ToolPanel.tsx
git commit -m "feat: widget Storage tab — captures localStorage/sessionStorage/cookies on open"
```

---

### Task 5.2: Health interceptor + HealthViewer tab

**Files:**
- Create: `widget/src/interceptors/health.ts`
- Create: `widget/src/tools/HealthViewer.tsx`
- Modify: `widget/src/toolbar/ToolPanel.tsx`
- Modify: `widget/src/index.ts`

**Step 1: Create health interceptor**

`widget/src/interceptors/health.ts`:

```ts
export interface HealthIssue {
  severity: 'error' | 'warn'
  category: 'image' | 'mixed-content' | 'alt-text' | 'slow-resource' | 'cors'
  message: string
  detail?: string
}

const issues: HealthIssue[] = []
const listeners: Array<() => void> = []

function push(issue: HealthIssue) {
  issues.push(issue)
  listeners.forEach((fn) => fn())
}

export function getHealthIssues(): HealthIssue[] { return [...issues] }
export function getHealthIssueCount(): number { return issues.length }
export function subscribeHealth(fn: () => void): () => void {
  listeners.push(fn)
  return () => listeners.splice(listeners.indexOf(fn), 1)
}

export function installHealthInterceptor() {
  // Broken images already in DOM
  document.querySelectorAll('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.src) {
      push({ severity: 'error', category: 'image', message: 'Broken image', detail: img.src })
    }
  })

  // Missing alt text
  const noAlt = document.querySelectorAll('img:not([alt])')
  if (noAlt.length > 0) {
    push({ severity: 'warn', category: 'alt-text', message: `${noAlt.length} image(s) missing alt text` })
  }

  // Mixed content
  document.addEventListener('securitypolicyviolation', (e) => {
    push({ severity: 'error', category: 'mixed-content', message: 'Mixed content blocked', detail: e.blockedURI })
  })

  // Slow resources (>2s) via PerformanceObserver
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const res = entry as PerformanceResourceTiming
        if (res.duration > 2000) {
          push({ severity: 'warn', category: 'slow-resource', message: `Slow resource: ${Math.round(res.duration)}ms`, detail: res.name })
        }
      }
    })
    observer.observe({ type: 'resource', buffered: true })
  } catch { /* not supported */ }
}
```

**Step 2: Create HealthViewer**

`widget/src/tools/HealthViewer.tsx`:

```tsx
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { getHealthIssues, subscribeHealth, type HealthIssue } from '../interceptors/health'
import { COLORS } from '../toolbar/styles'

export function HealthViewer() {
  const [issues, setIssues] = useState<HealthIssue[]>([])

  useEffect(() => {
    setIssues(getHealthIssues())
    return subscribeHealth(() => setIssues(getHealthIssues()))
  }, [])

  return h('div', { style: { flex: 1, overflowY: 'auto' } },
    issues.length === 0
      ? h('p', { style: { padding: 16, fontSize: 12, color: COLORS.textMuted } }, 'No health issues detected.')
      : issues.map((issue, i) =>
        h('div', { key: i, style: { padding: '8px 12px', borderBottom: `1px solid ${COLORS.panelBorder}`, display: 'flex', flexDirection: 'column', gap: 2 } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
            h('span', { style: { fontSize: 10, fontWeight: 600, color: issue.severity === 'error' ? '#ef4444' : '#f59e0b', textTransform: 'uppercase' } }, issue.severity),
            h('span', { style: { fontSize: 11, color: COLORS.text } }, issue.message)
          ),
          issue.detail && h('span', { style: { fontSize: 10, color: COLORS.textMuted, fontFamily: 'monospace', marginLeft: 12 } }, issue.detail)
        )
      )
  )
}
```

**Step 3: Wire into ToolPanel + index**

ToolPanel.tsx:
- Import: `import { HealthViewer } from '../tools/HealthViewer'`
- Add to TOOLS: `{ id: 'health', label: 'Health', icon: '\u{2764}' }`
- Add to stretch + render chain

index.ts:
- Import: `import { installHealthInterceptor } from './interceptors/health'`
- Call after `initInterceptors()`: `installHealthInterceptor()`

**Step 4: Build widget**

```bash
npm run build:widget 2>&1 | tail -10
```

**Step 5: Commit**

```bash
git add widget/src/interceptors/health.ts widget/src/tools/HealthViewer.tsx widget/src/toolbar/ToolPanel.tsx widget/src/index.ts
git commit -m "feat: widget Health tab — broken images, mixed content, missing alt, slow resources"
```

---

### Task 5.3: Snapshot v2 fixes

**Files:**
- Modify: `widget/src/tools/DebugSnapshot.tsx`

**Step 1: Read the current DebugSnapshot.tsx**

```bash
cat widget/src/tools/DebugSnapshot.tsx
```

Locate: (a) clipboard paste handler, (b) screen capture function, (c) folder path display.

**Step 2: Fix 1 — Paste to WebP via canvas**

Add this helper function at the top of the file:

```ts
async function blobToWebP(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      canvas.toBlob((out) => resolve(out ?? blob), 'image/webp', 0.82)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}
```

In the paste handler, wrap the file: `const webpBlob = await blobToWebP(file)` and use `webpBlob` instead of `file`.

**Step 3: Fix 2 — Screen capture crash fix**

In the screen capture function, after `await video.play()`:

```ts
// Stop stream immediately — video retains last frame
stream.getTracks().forEach((t) => t.stop())
const MAX_WIDTH = 1440
const scale = Math.min(1, MAX_WIDTH / video.videoWidth)
canvas.width = Math.round(video.videoWidth * scale)
canvas.height = Math.round(video.videoHeight * scale)
ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
```

Remove any existing `MAX_WIDTH = 1920` and any stream stop that happens after canvas draw.

**Step 4: Fix 3 — Download location UI**

Replace any editable folder path input with a static note:

```ts
h('p', {
  style: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', padding: '4px 8px' },
},
  'Screenshots save to ~/Downloads · ',
  h('a', {
    style: { color: '#475569', textDecoration: 'underline', cursor: 'pointer' },
    href: '/settings/widget',
    target: '_blank',
  }, 'Set label in Settings')
)
```

**Step 5: Build widget + smoke test**

```bash
npm run build:widget 2>&1 | tail -10
```

Open the Snapshot tab on a test page, take a screenshot, verify it downloads as .webp.

**Step 6: Commit**

```bash
git add widget/src/tools/DebugSnapshot.tsx
git commit -m "fix: Snapshot v2 — paste→WebP canvas, stop stream before draw, 1440px cap, download note"
```

---
## Phase 6 — Widget Routines + AI Tabs

### Task 6.1: Widget Routines tab (active run)

**Files:**
- Create: `widget/src/tools/RoutinesTab.tsx`
- Modify: `widget/src/toolbar/ToolPanel.tsx`

**Step 1: Create RoutinesTab**

`widget/src/tools/RoutinesTab.tsx`:

```tsx
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { COLORS } from '../toolbar/styles'

interface Checklist { id: number; name: string }
interface RunItem { id: number; itemId: number; checked: number }
interface ItemDef { id: number; name: string; snippet?: string | null }
interface Run { id: number; checklistId: number; startedAt: string; items?: RunItem[] }
interface Props { apiBase: string; pinHash: string; projectId: string }

export function RoutinesTab({ apiBase, pinHash, projectId }: Props) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [activeRun, setActiveRun] = useState<Run | null>(null)
  const [itemDefs, setItemDefs] = useState<ItemDef[]>([])
  const h_ = { 'X-DevTools-Pin': pinHash, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch(`${apiBase}/api/routines?projectId=${projectId}`, { headers: h_ })
      .then((r) => r.json()).then(setChecklists)
  }, [projectId])

  async function startRun(checklistId: number) {
    const res = await fetch(`${apiBase}/api/routines/${checklistId}/runs`, { method: 'POST', headers: h_ })
    if (!res.ok) return
    const run: Run = await res.json()
    const [full, defs] = await Promise.all([
      fetch(`${apiBase}/api/routines/runs/${run.id}`, { headers: h_ }).then((r) => r.json()),
      fetch(`${apiBase}/api/routines/${checklistId}/items`, { headers: h_ }).then((r) => r.json()),
    ])
    setActiveRun(full)
    setItemDefs(defs)
  }

  async function checkItem(itemId: number, checked: boolean) {
    if (!activeRun) return
    await fetch(`${apiBase}/api/routines/runs/${activeRun.id}/items?itemId=${itemId}`, {
      method: 'PUT', headers: h_, body: JSON.stringify({ checked }),
    })
    setActiveRun((prev) => prev ? {
      ...prev,
      items: prev.items?.map((i) => i.itemId === itemId ? { ...i, checked: checked ? 1 : 0 } : i),
    } : null)
  }

  const total = activeRun?.items?.length ?? 0
  const checked = activeRun?.items?.filter((i) => i.checked).length ?? 0
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0

  if (activeRun) {
    return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
      h('div', { style: { padding: '8px 12px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
        h('div', { style: { height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' } },
          h('div', { style: { height: '100%', background: '#6366f1', borderRadius: 2, width: `${pct}%`, transition: 'width .2s' } })
        ),
        h('span', { style: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, display: 'block' } }, `${checked} / ${total} complete`)
      ),
      h('div', { style: { flex: 1, overflowY: 'auto', padding: '4px 0' } },
        (activeRun.items ?? []).map((runItem) => {
          const def = itemDefs.find((d) => d.id === runItem.itemId)
          return h('div', { key: runItem.id, style: { padding: '8px 12px', borderBottom: `1px solid ${COLORS.panelBorder}` } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              h('input', { type: 'checkbox', checked: runItem.checked === 1,
                onChange: (e: Event) => checkItem(runItem.itemId, (e.target as HTMLInputElement).checked) }),
              h('span', { style: { fontSize: 11, color: runItem.checked ? COLORS.textMuted : COLORS.text, textDecoration: runItem.checked ? 'line-through' : 'none' } }, def?.name ?? `Item ${runItem.itemId}`)
            ),
            def?.snippet && h('div', { style: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 22 } },
              h('code', { style: { fontSize: 10, color: '#94a3b8', background: '#0a0f1a', padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, def.snippet),
              h('button', { style: { background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 12 },
                onClick: () => navigator.clipboard.writeText(def.snippet ?? '') }, '⧉')
            )
          )
        })
      ),
      h('button', {
        style: { margin: 8, padding: '6px 0', border: `1px solid ${COLORS.panelBorder}`, borderRadius: 6, background: 'none', color: COLORS.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
        onClick: () => setActiveRun(null),
      }, 'Close Run')
    )
  }

  return h('div', { style: { padding: 12, display: 'flex', flexDirection: 'column', gap: 8 } },
    h('p', { style: { fontSize: 11, color: COLORS.textMuted } }, 'Start a checklist run:'),
    ...checklists.map((c) =>
      h('button', { key: c.id,
        style: { padding: '7px 12px', borderRadius: 6, background: COLORS.toolBtnBg, border: `1px solid ${COLORS.panelBorder}`, color: COLORS.text, fontSize: 11, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
        onClick: () => startRun(c.id) }, '▶ ' + c.name)
    ),
    checklists.length === 0 && h('p', { style: { fontSize: 10, color: COLORS.textMuted } }, 'No checklists. Create one in Dashboard → Routines.')
  )
}
```

**Step 2: Wire into ToolPanel**

1. Import: `import { RoutinesTab } from '../tools/RoutinesTab'`
2. Add to TOOLS: `{ id: 'routines', label: 'Routines', icon: '\u{2713}' }`
3. Add to stretch condition: `|| activeTool === 'routines'`
4. Add to render: `: activeTool === 'routines' ? h(RoutinesTab, { apiBase, pinHash, projectId })`
   - `apiBase`, `pinHash`, `projectId` are already props on ToolPanel

**Step 3: Build widget**

```bash
npm run build:widget 2>&1 | tail -10
```

**Step 4: Commit**

```bash
git add widget/src/tools/RoutinesTab.tsx widget/src/toolbar/ToolPanel.tsx
git commit -m "feat: widget Routines tab — active run with progress bar and snippet copy"
```

---

### Task 6.2: AI tab page context injection

**Files:**
- Modify: `widget/src/tools/AIChat.tsx`

**Step 1: Read current AIChat.tsx**

```bash
cat widget/src/tools/AIChat.tsx
```

Find where the message is sent to the API endpoint. Identify the message payload construction.

**Step 2: Add context builder + inject into first message**

Add imports at top:

```ts
import { getConsoleEntries } from '../interceptors/console'
import { getNetworkEntries } from '../interceptors/network'
import { getErrorEntries } from '../interceptors/errors'
```

Add helper function:

```ts
function buildPageContext(): string {
  const errors = getErrorEntries().slice(0, 5).map((e) => `- ${e.message}`).join('\n')
  const net = getNetworkEntries().filter((e) => e.status >= 400).slice(0, 5)
    .map((e) => `- ${e.method} ${e.url} → ${e.status}`).join('\n')
  const cons = getConsoleEntries()
    .filter((e) => e.level === 'error' || e.level === 'warn').slice(0, 5)
    .map((e) => `[${e.level}] ${e.message}`).join('\n')
  const parts = [
    `Page: ${window.location.href}`,
    errors && `Recent errors:\n${errors}`,
    net && `Network issues:\n${net}`,
    cons && `Console issues:\n${cons}`,
  ].filter(Boolean)
  return parts.join('\n\n')
}
```

On the first message send (when messages array is empty), prepend context:

```ts
const context = buildPageContext()
const messageWithContext = messages.length === 0 && context
  ? `Context:\n${context}\n\n---\n\n${userMessage}`
  : userMessage
```

Keep context injection under 2000 chars total to avoid inflating tokens.

**Step 3: Build widget**

```bash
npm run build:widget 2>&1 | tail -10
```

**Step 4: Commit**

```bash
git add widget/src/tools/AIChat.tsx
git commit -m "feat: AI tab auto-injects page context (errors, network issues, console) on first message"
```

---
## Phase 7 — Copy System

### Task 7.1: Copy utilities module + tests

**Files:**
- Create: `widget/src/lib/copy.ts`
- Create: `widget/src/lib/__tests__/copy.test.ts`

**Step 1: Write failing tests first**

`widget/src/lib/__tests__/copy.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatConsoleRow, formatNetworkRow, formatErrorRow, formatHealthRow } from '../copy'

describe('formatConsoleRow', () => {
  it('includes level and message', () => {
    const entry = { level: 'error' as const, message: 'Oops', timestamp: Date.now(), source: 'app.js' }
    const out = formatConsoleRow(entry)
    expect(out).toContain('[ERROR]')
    expect(out).toContain('Oops')
  })
})

describe('formatNetworkRow', () => {
  it('formats method + url + status', () => {
    const entry = { method: 'GET', url: '/api/users', status: 404, duration: 50, type: 'fetch', timestamp: Date.now() }
    expect(formatNetworkRow(entry)).toBe('[NETWORK] GET /api/users → 404  50ms  fetch')
  })
})

describe('formatErrorRow', () => {
  it('includes stack trace', () => {
    const entry = { message: 'TypeError', stack: '  at foo.js:12', timestamp: Date.now() }
    const out = formatErrorRow(entry)
    expect(out).toContain('TypeError')
    expect(out).toContain('foo.js:12')
  })
})

describe('formatHealthRow', () => {
  it('includes severity and message', () => {
    const issue = { severity: 'warn' as const, category: 'alt-text' as const, message: '2 images missing alt' }
    expect(formatHealthRow(issue)).toBe('[WARN] 2 images missing alt')
  })
})
```

**Step 2: Run test — expect FAIL**

```bash
npm run test widget/src/lib/__tests__/copy.test.ts
```

**Step 3: Implement copy.ts**

`widget/src/lib/copy.ts`:

```ts
import type { ConsoleEntry } from '../interceptors/console'
import type { NetworkEntry } from '../interceptors/network'
import type { ErrorEntry } from '../interceptors/errors'
import type { HealthIssue } from '../interceptors/health'

export function formatConsoleRow(entry: ConsoleEntry): string {
  const ts = new Date(entry.timestamp).toLocaleTimeString()
  return `[${entry.level.toUpperCase()}] ${entry.message} — ${ts}`
}

export function formatNetworkRow(entry: NetworkEntry): string {
  return `[NETWORK] ${entry.method} ${entry.url} → ${entry.status}  ${entry.duration}ms  ${entry.type}`
}

export function formatErrorRow(entry: ErrorEntry): string {
  return `[ERROR] ${entry.message}\n  ${entry.stack ?? ''}`.trimEnd()
}

export function formatHealthRow(issue: HealthIssue): string {
  return `[${issue.severity.toUpperCase()}] ${issue.message}${issue.detail ? ` — ${issue.detail}` : ''}`
}

export function formatConsoleTab(entries: ConsoleEntry[]): string {
  return `### Console (${entries.length})\n${entries.map(formatConsoleRow).join('\n')}`
}

export function formatNetworkTab(entries: NetworkEntry[]): string {
  return `### Network (${entries.length})\n${entries.map(formatNetworkRow).join('\n')}`
}

export function formatErrorsTab(entries: ErrorEntry[]): string {
  return `### Errors (${entries.length})\n${entries.map(formatErrorRow).join('\n\n')}`
}

export function formatHealthTab(issues: HealthIssue[]): string {
  return `### Health Issues (${issues.length})\n${issues.map(formatHealthRow).join('\n')}`
}

export function buildCopyForClaudeBundle(
  consoleEntries: ConsoleEntry[],
  networkEntries: NetworkEntry[],
  errorEntries: ErrorEntry[],
  healthIssues: HealthIssue[],
): string {
  const errors = errorEntries.slice(0, 10)
  const warnings = consoleEntries.filter((e) => e.level === 'warn').slice(0, 10)
  const netIssues = networkEntries.filter((e) => e.status >= 400).slice(0, 10)
  const now = new Date().toLocaleString()

  const sections = [
    `## Page Context — ${window.location.href}`,
    `**Captured:** ${now}`,
  ]

  if (errors.length > 0) sections.push(formatErrorsTab(errors))
  if (warnings.length > 0) {
    sections.push(`### Console Warnings (${warnings.length})\n${warnings.map(formatConsoleRow).join('\n')}`)
  }
  if (netIssues.length > 0) {
    sections.push(`### Network Issues (${netIssues.length})\n${netIssues.map(formatNetworkRow).join('\n')}`)
  }
  if (healthIssues.length > 0) sections.push(formatHealthTab(healthIssues))

  return sections.join('\n\n')
}
```

**Step 4: Run tests — expect PASS**

```bash
npm run test widget/src/lib/__tests__/copy.test.ts
```

**Step 5: Commit**

```bash
git add widget/src/lib/copy.ts widget/src/lib/__tests__/copy.test.ts
git commit -m "feat: widget copy utilities — row/tab formatters with tests"
```

---

### Task 7.2: Row-level copy + tab-level copy in viewers

Apply the same hover-reveal copy pattern to all four viewer components.

**Files to modify:**
- `widget/src/tools/ConsoleViewer.tsx`
- `widget/src/tools/NetworkViewer.tsx`
- `widget/src/tools/ErrorOverlay.tsx`
- `widget/src/tools/HealthViewer.tsx`

**Pattern for each file:**

1. Import the relevant formatter and tab formatter:
   ```ts
   import { formatConsoleRow, formatConsoleTab } from '../lib/copy'
   ```

2. Add `hoveredRow` state: `const [hoveredRow, setHoveredRow] = useState<number | null>(null)`

3. On each row container, add hover handlers:
   ```ts
   onMouseEnter: () => setHoveredRow(i),
   onMouseLeave: () => setHoveredRow(null),
   ```

4. Add copy button to row (hidden until hover):
   ```ts
   h('button', {
     style: { background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', flexShrink: 0,
       color: COLORS.textMuted, fontSize: 12,
       opacity: hoveredRow === i ? 1 : 0, transition: 'opacity .1s' },
     onClick: (e: MouseEvent) => { e.stopPropagation(); navigator.clipboard.writeText(formatConsoleRow(entry)) },
   }, '⧉')
   ```

5. Add "Copy [Tab]" button in the tab header area:
   ```ts
   h('button', {
     style: { background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 10,
       padding: '2px 8px', borderRadius: 4, border: `1px solid ${COLORS.panelBorder}`, marginLeft: 'auto' },
     onClick: () => navigator.clipboard.writeText(formatConsoleTab(entries)),
   }, 'Copy Console')
   ```

Apply the same pattern for Network (`formatNetworkRow`/`formatNetworkTab`), Errors (`formatErrorRow`/`formatErrorsTab`), Health (`formatHealthRow`/`formatHealthTab`).

**Step 2: Build widget**

```bash
npm run build:widget 2>&1 | tail -10
```

**Step 3: Commit**

```bash
git add widget/src/tools/ConsoleViewer.tsx widget/src/tools/NetworkViewer.tsx widget/src/tools/ErrorOverlay.tsx widget/src/tools/HealthViewer.tsx
git commit -m "feat: row-level hover copy + tab-level copy buttons in all widget viewers"
```

---

### Task 7.3: "Copy for Claude" panel header button

**Files:**
- Modify: `widget/src/toolbar/ToolPanel.tsx`

**Step 1: Add imports**

```ts
import { buildCopyForClaudeBundle } from '../lib/copy'
import { getConsoleEntries } from '../interceptors/console'
import { getNetworkEntries } from '../interceptors/network'
import { getErrorEntries } from '../interceptors/errors'
import { getHealthIssues } from '../interceptors/health'
```

**Step 2: Add button to panel header**

In the panel header (between the project title span and the close button), add:

```ts
h('button', {
  style: {
    background: 'none', border: `1px solid ${COLORS.panelBorder}`, color: COLORS.textMuted,
    cursor: 'pointer', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit',
    marginLeft: 'auto', marginRight: 6,
  },
  title: 'Copy full page context for Claude',
  onClick: () => {
    const bundle = buildCopyForClaudeBundle(
      getConsoleEntries(),
      getNetworkEntries(),
      getErrorEntries(),
      getHealthIssues(),
    )
    navigator.clipboard.writeText(bundle)
  },
}, '⧉ Copy for Claude')
```

**Step 3: Build widget**

```bash
npm run build:widget 2>&1 | tail -10
```

**Step 4: Commit**

```bash
git add widget/src/toolbar/ToolPanel.tsx
git commit -m "feat: Copy for Claude bundle button in widget panel header"
```

---
## Phase 8 — Dashboard Visual Refresh

### Task 8.1: Reduce card padding

**Files:** Any dashboard component using `p-6` on card wrappers.

**Step 1: Find all p-6 usages in dashboard components**

```bash
grep -rn "p-6" src/components/dashboard src/app/\(dashboard\) --include="*.tsx" | grep -v "node_modules"
```

**Step 2: Replace p-6 → p-4 on card containers**

For each file found, change the outermost card padding class from `p-6` to `p-4`. Do NOT change padding inside deeply nested elements — only the card/panel wrapper.

**Step 3: Commit**

```bash
git add src/components/dashboard
git commit -m "style: tighten card padding p-6 → p-4 across dashboard components"
```

---

### Task 8.2: Tighten table rows + monospace values

**Files:** All data table pages: bugs, console, network, errors, devlog, perf.

**Step 1: Find table row padding**

```bash
grep -rn "py-4\|py-3" src/app/\(dashboard\) --include="*.tsx" | grep -v "node_modules" | grep -i "td\|tr\|row"
```

**Step 2: Tighten table rows**

Change `py-4` → `py-2` and `py-3` → `py-1.5` on all table body row elements (td, tr).

**Step 3: Monospace for data values**

Add `font-mono text-xs` to cells containing: timestamps, URLs, status codes, HTTP methods, log messages, stack traces.

Pattern to search:
```bash
grep -rn "className.*text-sm" src/app/\(dashboard\) --include="*.tsx" | grep -i "status\|url\|time\|method" | head -20
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)
git commit -m "style: tighter table rows + monospace for data values across all log pages"
```

---

### Task 8.3: Sidebar contrast + badge counts

**Files:**
- Modify: `src/components/sidebar.tsx`

**Step 1: Increase section label contrast**

Find the section label element:
```tsx
<p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase">
```

Change to:
```tsx
<p className="px-3 py-1 text-xs font-semibold text-foreground/60 uppercase tracking-wide">
```

**Step 2: Add badge counts to Debug nav items**

Add state and fetch at the top of the `Sidebar` function:

```tsx
const [counts, setCounts] = useState({ bugs: 0, errors: 0 })
useEffect(() => {
  fetch('/api/bugs?status=open&limit=500')
    .then((r) => r.json())
    .then((d) => setCounts((prev) => ({ ...prev, bugs: Array.isArray(d) ? d.length : 0 })))
  fetch('/api/devlog?type=error&days=1&limit=500')
    .then((r) => r.json())
    .then((d) => setCounts((prev) => ({ ...prev, errors: Array.isArray(d) ? d.length : 0 })))
}, [])
```

In the nav item render, add badges after the label for /bugs and /errors:

```tsx
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
```

**Step 3: Dev server smoke test**

```bash
npm run dev
```

Check sidebar: section labels should be more visible, badge counts appear for bugs/errors if any exist.

**Step 4: Commit**

```bash
git add src/components/sidebar.tsx
git commit -m "style: sidebar section contrast + bug/error badge counts on nav items"
```

---

## Final: Full Build + Deploy

### Task F.1: Run full test suite

```bash
npm run test
```

Expected: all tests pass. Fix any failures before proceeding.

### Task F.2: Production build

```bash
npm run build
```

Expected: build completes with no TypeScript errors.

### Task F.3: Deploy

```bash
git push origin main
```

Monitor Vercel deployment at: https://vercel.com/jb-cloud-apps/devtools

### Task F.4: Add NOTION_API_TOKEN to Vercel

The Hub KB panel requires this env var in production.

```bash
# Check 1Password first
# Then deploy to Vercel
vercel env add NOTION_API_TOKEN production
```

Or use the Vercel dashboard: Settings → Environment Variables.

### Task F.5: Production smoke test

- [ ] `/hub` loads — Notion KB panel shows entries
- [ ] `/routines` — create a checklist, add items, start a run, check items
- [ ] `⌘K` in dashboard — command palette opens with KB entries
- [ ] Widget on a client site — `⌘⇧K` opens widget command palette
- [ ] Widget Storage tab — shows localStorage/sessionStorage on open
- [ ] Widget Health tab — shows health scan results
- [ ] Widget "Copy for Claude" button — copies markdown bundle to clipboard
- [ ] Snapshot tab — paste screenshot converts to WebP

---

## Appendix: Key File Reference

| File | Role |
|------|------|
| `src/lib/db/schema.ts` | All Drizzle table definitions — add new tables here |
| `src/lib/api.ts` | Zod schemas + `parseBody()` + `apiError()` + `verifyWidgetPin()` |
| `src/components/sidebar.tsx` | Nav sections array — Resources section added at top |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell — CommandPalette rendered here |
| `widget/src/toolbar/ToolPanel.tsx` | TOOLS array + activeTool render chain |
| `widget/src/index.ts` | Shadow DOM mount, interceptor init, keyboard shortcuts |
| `widget/src/interceptors/console.ts` | Template for all interceptors (same buffer/subscribe pattern) |
| `src/app/api/__tests__/bugs.test.ts` | Reference test (vi.hoisted mock chain for Drizzle) |

## Appendix: New Routes Summary

| Route | Methods | Phase |
|-------|---------|-------|
| `/api/routines` | GET, POST | 1 |
| `/api/routines/[id]` | GET, PUT, DELETE | 1 |
| `/api/routines/[id]/items` | GET, POST | 1 |
| `/api/routines/items/[id]` | PUT, DELETE | 1 |
| `/api/routines/[id]/runs` | GET, POST | 1 |
| `/api/routines/runs/[runId]` | GET, PUT | 1 |
| `/api/routines/runs/[runId]/items` | PUT | 1 |
| `/api/hub/kb` | GET | 1 |
| `/api/hub/plans` | GET | 1 |

## Appendix: New Widget Files Summary

| File | Phase |
|------|-------|
| `widget/src/interceptors/storage.ts` | 5 |
| `widget/src/interceptors/health.ts` | 5 |
| `widget/src/tools/StorageViewer.tsx` | 5 |
| `widget/src/tools/HealthViewer.tsx` | 5 |
| `widget/src/tools/CommandPalette.tsx` | 4 |
| `widget/src/tools/RoutinesTab.tsx` | 6 |
| `widget/src/lib/copy.ts` | 7 |
