# Ideas Panel + Cross-App Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an Ideas tab to the DevTools floating widget, sync ideas to `~/.claude/ideas.md` via `/start`+`/end`, and ship a `DevToolsProjectPanel` component + `/devtools-install-panel` skill for embedding bugs+ideas in any app's settings page.

**Architecture:** DevTools DB (Turso) is the single source of truth. Widget captures ideas via PIN-authed POST; dashboard and settings plugin read via API-key-authed GET. Claude syncs on session start/end through a `DEVTOOLS_API_KEY` stored in 1Password.

**Tech Stack:** Next.js 16 + React 19 + Drizzle ORM + Turso (libsql) + Zod + Vitest (tests) | Preact + Vite (widget)

**Design doc:** `docs/plans/2026-02-23-ideas-cross-app-plugin-design.md`

---

## Task 1: Add `ideas` table to DB schema

**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Add the table definition after the `bugs` table**

In `src/lib/db/schema.ts`, after the `bugs` table block, insert:

```typescript
/** Ideas captured via the widget or dashboard for a project. */
export const ideas = sqliteTable('ideas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  body: text('body'),
  /** Enum: 'idea' | 'in-progress' | 'done' */
  status: text('status').notNull().default('idea'),
  /** JSON array of tag strings */
  tags: text('tags'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (t) => [
  index('ideas_project_id_idx').on(t.projectId),
])
```

**Step 2: Run the migration via Turso HTTP API**

```bash
curl -sX POST \
  "${TURSO_DATABASE_URL}/v2/pipeline" \
  -H "Authorization: Bearer ${TURSO_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"type":"execute","stmt":{"sql":"CREATE TABLE IF NOT EXISTS ideas (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT NOT NULL, body TEXT, status TEXT NOT NULL DEFAULT '\''idea'\'', tags TEXT, created_at TEXT DEFAULT (datetime('\''now'\'')), updated_at TEXT DEFAULT (datetime('\''now'\'')))"}},
      {"type":"execute","stmt":{"sql":"CREATE INDEX IF NOT EXISTS ideas_project_id_idx ON ideas(project_id)"}},
      {"type":"close"}
    ]
  }'
```

Expected: `{"results":[...]}` with no `error` keys.

**Step 3: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat: add ideas table to schema"
```

---

## Task 2: Add IdeaSchema + verifyApiKey to api.ts

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/lib/__tests__/api.test.ts`

**Step 1: Write the failing tests**

In `src/lib/__tests__/api.test.ts`, add after existing `BugSchema` tests:

```typescript
describe('IdeaSchema', () => {
  it('accepts valid idea', () => {
    const result = parseBody(IdeaSchema, { projectId: 'p1', title: 'My idea' })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const result = parseBody(IdeaSchema, { projectId: 'p1' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = parseBody(IdeaSchema, { projectId: 'p1', title: 'x', status: 'unknown' })
    expect(result.success).toBe(false)
  })
})

describe('verifyApiKey', () => {
  beforeEach(() => {
    process.env.DEVTOOLS_API_KEY = 'test-key-abc'
  })

  it('returns null for correct key', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-devtools-api-key': 'test-key-abc' },
    })
    expect(verifyApiKey(req)).toBeNull()
  })

  it('returns 401 for wrong key', async () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-devtools-api-key': 'wrong' },
    })
    const res = verifyApiKey(req)
    expect(res?.status).toBe(401)
  })

  it('returns 401 when header missing', () => {
    const req = new Request('http://localhost/')
    const res = verifyApiKey(req)
    expect(res?.status).toBe(401)
  })
})
```

Update the import at the top to include `IdeaSchema, verifyApiKey`:
```typescript
import { apiError, parseBody, ProjectSchema, BugSchema, IdeaSchema, verifyApiKey, WidgetEventSchema } from '../api'
```

**Step 2: Run to confirm failure**

```bash
cd ~/devtools && npm test src/lib/__tests__/api.test.ts
```

Expected: FAIL — `IdeaSchema is not exported`, `verifyApiKey is not exported`

**Step 3: Add IdeaSchema and verifyApiKey to src/lib/api.ts**

Append to the bottom of `src/lib/api.ts`:

```typescript
export const IdeaSchema = z.object({
  projectId: z.string().min(1).max(128),
  title: z.string().min(1).max(512),
  body: z.string().max(10000).optional().nullable(),
  status: z.enum(['idea', 'in-progress', 'done']).default('idea'),
  tags: z.array(z.string().max(64)).max(10).optional(),
})

export const IdeaUpdateSchema = z.object({
  title: z.string().min(1).max(512).optional(),
  body: z.string().max(10000).optional().nullable(),
  status: z.enum(['idea', 'in-progress', 'done']).optional(),
  tags: z.array(z.string().max(64)).max(10).optional(),
})

/**
 * Verify the X-DevTools-Api-Key header against the DEVTOOLS_API_KEY env var.
 * Used by CLI and settings panel calls (not widget — those use PIN).
 * Returns an error response if verification fails, or null if it passes.
 */
export function verifyApiKey(request: Request): NextResponse | null {
  const key = request.headers.get('x-devtools-api-key')
  const expected = process.env.DEVTOOLS_API_KEY
  if (!key || !expected || key !== expected) {
    return apiError(401, 'Invalid or missing API key')
  }
  return null
}
```

**Step 4: Run tests again**

```bash
cd ~/devtools && npm test src/lib/__tests__/api.test.ts
```

Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add src/lib/api.ts src/lib/__tests__/api.test.ts
git commit -m "feat: add IdeaSchema and verifyApiKey helper"
```

---

## Task 3: API route — GET + POST /api/ideas

**Files:**
- Create: `src/app/api/ideas/route.ts`
- Create: `src/app/api/__tests__/ideas.test.ts`

**Step 1: Write the failing tests**

Create `src/app/api/__tests__/ideas.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAll, mockReturning, mockInsert, mockSelect } = vi.hoisted(() => {
  const mockReturning = vi.fn()
  const mockAll = vi.fn()
  const mockInsert = vi.fn(() => ({ values: vi.fn(() => ({ returning: mockReturning })) }))
  const mockLimit = vi.fn(() => ({ all: mockAll }))
  const mockWhere = vi.fn(() => ({ all: mockAll, limit: mockLimit }))
  const mockOrderBy = vi.fn(() => ({ where: mockWhere, all: mockAll, limit: mockLimit }))
  const mockSelect = vi.fn(() => ({ from: vi.fn(() => ({ orderBy: mockOrderBy })) }))
  return { mockAll, mockReturning, mockInsert, mockSelect }
})

vi.mock('@/lib/db', () => ({ db: { select: mockSelect, insert: mockInsert } }))
vi.mock('@/lib/db/schema', () => ({ ideas: {}, widgetConfig: {} }))
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), desc: vi.fn(), and: vi.fn() }))

// Set API key for auth tests
process.env.DEVTOOLS_API_KEY = 'test-api-key'

import { GET, POST } from '../ideas/route'

function getRequest(params = ''): Request {
  return new Request(`http://localhost/api/ideas${params}`, {
    headers: { 'x-devtools-api-key': 'test-api-key' },
  })
}

function postRequest(body: unknown, usePin = false): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (usePin) headers['x-devtools-pin'] = 'hashed-pin'
  else headers['x-devtools-api-key'] = 'test-api-key'
  return new Request('http://localhost/api/ideas', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('GET /api/ideas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns idea list', async () => {
    mockAll.mockResolvedValue([{ id: 1, title: 'Great idea', projectId: 'p1' }])
    const res = await GET(getRequest('?projectId=p1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('returns 401 without API key', async () => {
    const res = await GET(new Request('http://localhost/api/ideas'))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/ideas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates idea with valid data via API key', async () => {
    mockReturning.mockResolvedValue([{ id: 1, title: 'Build it', projectId: 'p1' }])
    const res = await POST(postRequest({ projectId: 'p1', title: 'Build it' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe('Build it')
  })

  it('returns 400 for missing projectId', async () => {
    const res = await POST(postRequest({ title: 'Oops' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing title', async () => {
    const res = await POST(postRequest({ projectId: 'p1' }))
    expect(res.status).toBe(400)
  })
})
```

**Step 2: Run to confirm failure**

```bash
cd ~/devtools && npm test src/app/api/__tests__/ideas.test.ts
```

Expected: FAIL — `Cannot find module '../ideas/route'`

**Step 3: Create src/app/api/ideas/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ideas } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { apiError, parseBody, verifyApiKey, verifyWidgetPin, IdeaSchema } from '@/lib/api'
import { sanitizeInput } from '@/lib/sanitize'

export async function GET(request: Request) {
  const authError = verifyApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const limitParam = searchParams.get('limit')

    const conditions = []
    if (projectId) conditions.push(eq(ideas.projectId, projectId))
    if (status) conditions.push(eq(ideas.status, status))

    let query = db.select().from(ideas).orderBy(desc(ideas.createdAt))
    if (conditions.length > 0) {
      query = query.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      ) as typeof query
    }

    const limit = limitParam ? parseInt(limitParam, 10) : undefined
    if (limit && limit > 0) {
      query = query.limit(Math.min(limit, 500)) as typeof query
    }

    const all = await query.all()
    return NextResponse.json(all)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to fetch ideas: ${message}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseBody(IdeaSchema, body)
    if (!parsed.success) return parsed.response

    // Widget uses PIN; CLI / dashboard use API key
    if (request.headers.get('x-devtools-pin')) {
      const pinError = await verifyWidgetPin(request, parsed.data.projectId)
      if (pinError) return pinError
    } else {
      const keyError = verifyApiKey(request)
      if (keyError) return keyError
    }

    const { tags, ...fields } = parsed.data
    const result = await db
      .insert(ideas)
      .values({
        ...fields,
        title: sanitizeInput(fields.title),
        body: fields.body ? sanitizeInput(fields.body) : null,
        tags: tags ? JSON.stringify(tags) : null,
      })
      .returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to create idea: ${message}`)
  }
}
```

**Step 4: Run tests**

```bash
cd ~/devtools && npm test src/app/api/__tests__/ideas.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/ideas/route.ts src/app/api/__tests__/ideas.test.ts
git commit -m "feat: add GET and POST /api/ideas"
```

---

## Task 4: API route — PATCH + DELETE /api/ideas/[id]

**Files:**
- Create: `src/app/api/ideas/[id]/route.ts`
- Modify: `src/app/api/__tests__/ideas.test.ts`

**Step 1: Add tests for PATCH and DELETE**

Append to `src/app/api/__tests__/ideas.test.ts`:

```typescript
// Additional mocks needed for [id] route
const { mockUpdate, mockDelete } = vi.hoisted(() => {
  const mockReturning2 = vi.fn()
  const mockWhere2 = vi.fn(() => ({ returning: mockReturning2 }))
  const mockSet = vi.fn(() => ({ where: mockWhere2 }))
  const mockUpdate = vi.fn(() => ({ set: mockSet }))
  const mockDelete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }))
  return { mockUpdate, mockDelete }
})
// Add to vi.mock('@/lib/db',...) — update the factory:
// db: { select: mockSelect, insert: mockInsert, update: mockUpdate, delete: mockDelete }
```

> Note: Because the mock is hoisted, add `update: mockUpdate, delete: mockDelete` to the existing `vi.mock('@/lib/db', ...)` factory object.

```typescript
import { PATCH, DELETE } from '../ideas/[id]/route'

function patchRequest(id: string, body: unknown): Request {
  return new Request(`http://localhost/api/ideas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-devtools-api-key': 'test-api-key' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/ideas/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates status', async () => {
    // mockReturning from update chain
    const mockRet = vi.fn().mockResolvedValue([{ id: 1, status: 'in-progress' }])
    mockUpdate.mockReturnValue({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: mockRet })) })) })
    const res = await PATCH(patchRequest('1', { status: 'in-progress' }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid id', async () => {
    const res = await PATCH(patchRequest('abc', { status: 'done' }), { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
  })

  it('returns 401 without API key', async () => {
    const res = await PATCH(
      new Request('http://localhost/api/ideas/1', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
      { params: Promise.resolve({ id: '1' }) }
    )
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/ideas/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes an idea', async () => {
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    const res = await DELETE(
      new Request('http://localhost/api/ideas/1', { headers: { 'x-devtools-api-key': 'test-api-key' } }),
      { params: Promise.resolve({ id: '1' }) }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 400 for invalid id', async () => {
    const res = await DELETE(
      new Request('http://localhost/api/ideas/nope', { headers: { 'x-devtools-api-key': 'test-api-key' } }),
      { params: Promise.resolve({ id: 'nope' }) }
    )
    expect(res.status).toBe(400)
  })
})
```

**Step 2: Run to confirm failure**

```bash
cd ~/devtools && npm test src/app/api/__tests__/ideas.test.ts
```

Expected: FAIL — `Cannot find module '../ideas/[id]/route'`

**Step 3: Create src/app/api/ideas/[id]/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ideas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { apiError, parseBody, verifyApiKey, IdeaUpdateSchema } from '@/lib/api'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyApiKey(request)
  if (authError) return authError

  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId) || numId <= 0) return apiError(400, 'Invalid idea id')

    const body = await request.json()
    const parsed = parseBody(IdeaUpdateSchema, body)
    if (!parsed.success) return parsed.response

    const { tags, ...fields } = parsed.data
    const result = await db
      .update(ideas)
      .set({
        ...fields,
        tags: tags !== undefined ? JSON.stringify(tags) : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(ideas.id, numId))
      .returning()

    if (result.length === 0) return apiError(404, 'Idea not found')
    return NextResponse.json(result[0])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to update idea: ${message}`)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyApiKey(request)
  if (authError) return authError

  try {
    const { id } = await params
    const numId = parseInt(id, 10)
    if (isNaN(numId) || numId <= 0) return apiError(400, 'Invalid idea id')

    await db.delete(ideas).where(eq(ideas.id, numId))
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, `Failed to delete idea: ${message}`)
  }
}
```

**Step 4: Run all idea tests**

```bash
cd ~/devtools && npm test src/app/api/__tests__/ideas.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/ideas/[id]/route.ts src/app/api/__tests__/ideas.test.ts
git commit -m "feat: add PATCH and DELETE /api/ideas/[id]"
```

---

## Task 5: Extend widget ApiClient with ideas methods

**Files:**
- Modify: `widget/src/api/client.ts`

**Step 1: Add idea methods to ApiClient interface and factory**

In `widget/src/api/client.ts`, extend the `ApiClient` interface:

```typescript
export interface ApiClient {
  readonly createBug: (data: Record<string, unknown>) => Promise<unknown>
  readonly createDevLog: (data: Record<string, unknown>) => Promise<unknown>
  readonly sendEvents: (events: unknown[]) => Promise<unknown>
  // Ideas
  readonly listIdeas: (projectId: string) => Promise<unknown>
  readonly createIdea: (data: Record<string, unknown>) => Promise<unknown>
  readonly updateIdea: (id: number, data: Record<string, unknown>) => Promise<unknown>
  readonly deleteIdea: (id: number) => Promise<unknown>
}
```

Add to the returned object in `createApiClient`:

```typescript
listIdeas: (projectId: string) =>
  request(`/api/ideas?projectId=${encodeURIComponent(projectId)}`),

createIdea: (data: Record<string, unknown>) =>
  request('/api/ideas', { method: 'POST', body: JSON.stringify(data) }),

updateIdea: (id: number, data: Record<string, unknown>) =>
  request(`/api/ideas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

deleteIdea: (id: number) =>
  request(`/api/ideas/${id}`, { method: 'DELETE' }),
```

**Step 2: Commit**

```bash
git add widget/src/api/client.ts
git commit -m "feat: add ideas methods to widget ApiClient"
```

---

## Task 6: Build IdeasTab widget component

**Files:**
- Create: `widget/src/tools/IdeasTab.tsx`

**Step 1: Create the component**

Create `widget/src/tools/IdeasTab.tsx`:

```tsx
import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { COLORS } from '../toolbar/styles'
import type { ApiClient } from '../api/client'

type IdeaStatus = 'idea' | 'in-progress' | 'done'

interface Idea {
  id: number
  title: string
  body: string | null
  status: IdeaStatus
  createdAt: string | null
}

interface IdeasTabProps {
  readonly apiClient: ApiClient
  readonly projectId: string
}

const STATUS_NEXT: Record<IdeaStatus, IdeaStatus> = {
  'idea': 'in-progress',
  'in-progress': 'done',
  'done': 'idea',
}

const STATUS_ICON: Record<IdeaStatus, string> = {
  'idea': '☆',
  'in-progress': '◑',
  'done': '✓',
}

const STATUS_COLOR: Record<IdeaStatus, string> = {
  'idea': COLORS.textMuted,
  'in-progress': '#6366f1',
  'done': '#22c55e',
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  height: '100%',
  width: '100%',
  overflow: 'hidden',
}

const inputRowStyle = {
  display: 'flex',
  gap: '6px',
  padding: '8px',
  borderBottom: `1px solid ${COLORS.panelBorder}`,
}

const inputStyle = {
  flex: 1,
  padding: '5px 8px',
  borderRadius: '4px',
  border: `1px solid ${COLORS.panelBorder}`,
  backgroundColor: 'rgba(0,0,0,0.3)',
  color: COLORS.textBright,
  fontSize: '12px',
  fontFamily: 'inherit',
  outline: 'none',
}

const addBtnStyle = {
  padding: '5px 10px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#6366f1',
  color: '#fff',
  fontSize: '11px',
  cursor: 'pointer',
  flexShrink: 0,
}

const listStyle = {
  flex: 1,
  overflowY: 'auto' as const,
  padding: '4px 0',
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 8px',
  borderBottom: `1px solid ${COLORS.panelBorder}`,
  position: 'relative' as const,
}

const titleStyle = {
  flex: 1,
  fontSize: '12px',
  color: COLORS.textBright,
  lineHeight: '1.3',
  wordBreak: 'break-word' as const,
}

const footerStyle = {
  borderTop: `1px solid ${COLORS.panelBorder}`,
  padding: '6px 8px',
}

const copyBtnStyle = {
  width: '100%',
  padding: '5px 0',
  borderRadius: '4px',
  border: `1px solid ${COLORS.panelBorder}`,
  backgroundColor: '#1a2547',
  color: '#a5b4fc',
  fontSize: '11px',
  cursor: 'pointer',
}

export function IdeasTab({ apiClient, projectId }: IdeasTabProps) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    apiClient.listIdeas(projectId)
      .then((data) => {
        if (!controller.signal.aborted) {
          setIdeas((data as Idea[]) ?? [])
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [projectId])

  const handleAdd = useCallback(async () => {
    const title = draft.trim()
    if (!title || adding) return
    setAdding(true)
    const optimistic: Idea = { id: Date.now(), title, body: null, status: 'idea', createdAt: null }
    setIdeas((prev) => [optimistic, ...prev])
    setDraft('')
    try {
      const created = await apiClient.createIdea({ projectId, title }) as Idea
      setIdeas((prev) => prev.map((i) => i.id === optimistic.id ? created : i))
    } catch {
      setIdeas((prev) => prev.filter((i) => i.id !== optimistic.id))
    } finally {
      setAdding(false)
    }
  }, [draft, adding, projectId, apiClient])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }, [handleAdd])

  const cycleStatus = useCallback(async (idea: Idea) => {
    const next = STATUS_NEXT[idea.status]
    setIdeas((prev) => prev.map((i) => i.id === idea.id ? { ...i, status: next } : i))
    try {
      await apiClient.updateIdea(idea.id, { status: next })
    } catch {
      setIdeas((prev) => prev.map((i) => i.id === idea.id ? { ...i, status: idea.status } : i))
    }
  }, [apiClient])

  const handleDelete = useCallback(async (id: number) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id))
    await apiClient.deleteIdea(id).catch(() => {})
  }, [apiClient])

  const handleCopy = useCallback(() => {
    const open = ideas.filter((i) => i.status !== 'done')
    const lines = open.map((i) => {
      const prefix = i.status === 'in-progress' ? '- [ ] (in-progress)' : '- [ ]'
      return `${prefix} ${i.title}`
    })
    const text = `### Ideas — ${projectId}\n${lines.join('\n')}`
    navigator.clipboard?.writeText(text).catch(() => {})
  }, [ideas, projectId])

  return h('div', { style: containerStyle },
    h('div', { style: inputRowStyle },
      h('input', {
        style: inputStyle,
        placeholder: 'New idea…',
        value: draft,
        onInput: (e: Event) => setDraft((e.target as HTMLInputElement).value),
        onKeyDown: handleKeyDown,
      }),
      h('button', { style: addBtnStyle, onClick: handleAdd, disabled: adding }, '+')
    ),
    h('div', { style: listStyle },
      ideas.length === 0
        ? h('div', { style: { padding: '16px 8px', fontSize: '11px', color: COLORS.textMuted, textAlign: 'center' } }, 'No ideas yet')
        : ideas.map((idea) =>
          h('div', { key: idea.id, style: rowStyle },
            h('button', {
              onClick: () => cycleStatus(idea),
              style: {
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: STATUS_COLOR[idea.status],
                padding: '0 2px',
                flexShrink: 0,
              },
              title: `Status: ${idea.status} — click to cycle`,
            }, STATUS_ICON[idea.status]),
            h('span', { style: { ...titleStyle, opacity: idea.status === 'done' ? 0.5 : 1 } }, idea.title),
            h('button', {
              onClick: () => handleDelete(idea.id),
              style: {
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: COLORS.textMuted,
                padding: '0 2px',
                flexShrink: 0,
              },
              title: 'Delete',
            }, '×')
          )
        )
    ),
    h('div', { style: footerStyle },
      h('button', { style: copyBtnStyle, onClick: handleCopy }, 'Copy for Claude')
    )
  )
}
```

**Step 2: Commit**

```bash
git add widget/src/tools/IdeasTab.tsx
git commit -m "feat: add IdeasTab widget component"
```

---

## Task 7: Wire IdeasTab into ToolPanel + rebuild widget

**Files:**
- Modify: `widget/src/toolbar/ToolPanel.tsx`

**Step 1: Import IdeasTab**

At the top of `widget/src/toolbar/ToolPanel.tsx`, add:

```typescript
import { IdeasTab } from '../tools/IdeasTab'
```

**Step 2: Add Ideas to the TABS array**

Find the `TABS` constant and add the Ideas entry after `routines`:

```typescript
{ id: 'routines', label: 'Routines', icon: '\u2713' },
{ id: 'ideas', label: 'Ideas', icon: '\u2606' },   // ☆
{ id: 'ai', label: 'AI', icon: '\u2726' },
```

**Step 3: Add badge polling for ideas**

In the `setBadges` call inside `useEffect`, add `ideas` count. First, add a state fetch — after the existing badge polling effect, add a dedicated ideas badge effect:

```typescript
const [ideaCount, setIdeaCount] = useState(0)

useEffect(() => {
  function fetchCount() {
    apiClient.listIdeas(projectId)
      .then((data) => {
        const all = (data as Array<{ status: string }>) ?? []
        setIdeaCount(all.filter((i) => i.status !== 'done').length)
      })
      .catch(() => {})
  }
  fetchCount()
  const timer = setInterval(fetchCount, 10000)
  return () => clearInterval(timer)
}, [projectId, apiClient])
```

**Step 4: Add Ideas tab badge to tabDefs**

Find where `tabDefs` is built (or where badges are merged into TABS). Add:

```typescript
ideas: ideaCount,
```

alongside the existing `errors` and `console` badge entries.

**Step 5: Render IdeasTab in the switch/conditional**

Find the section that renders tool content based on `activeTab`. Add:

```typescript
{activeTab === 'ideas' && (
  <IdeasTab apiClient={apiClient} projectId={projectId} />
)}
```

(The widget uses `h()` calls, not JSX — mirror the pattern of how `RoutinesTab` is rendered in the existing switch.)

**Step 6: Rebuild widget**

```bash
cd ~/devtools/widget && npm run build
```

Expected: Build succeeds, `../public/widget.js` is updated.

**Step 7: Verify locally**

Open any test page that embeds `widget.js` — confirm the `☆ Ideas` tab appears and you can add/cycle/delete ideas.

**Step 8: Commit**

```bash
git add widget/src/toolbar/ToolPanel.tsx public/widget.js
git commit -m "feat: wire Ideas tab into widget ToolPanel"
```

---

## Task 8: DevTools dashboard — Ideas page

**Files:**
- Create: `src/app/(dashboard)/ideas/page.tsx`
- Modify: `src/components/sidebar.tsx`

**Step 1: Create the Ideas dashboard page**

Create `src/app/(dashboard)/ideas/page.tsx`:

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Plus, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Idea = {
  id: number
  projectId: string
  title: string
  body: string | null
  status: string | null
  createdAt: string | null
}

type Project = { id: string; name: string }

const STATUS_STYLES: Record<string, string> = {
  'idea': 'bg-slate-800 text-slate-300 border-slate-600',
  'in-progress': 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
  'done': 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
}

const STATUS_CYCLE: Record<string, string> = {
  'idea': 'in-progress',
  'in-progress': 'done',
  'done': 'idea',
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newProject, setNewProject] = useState('')
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/ideas').then((r) => r.json()),
      fetch('/api/projects').then((r) => r.json()),
    ]).then(([ideaList, projectList]) => {
      setIdeas(ideaList)
      setProjects(projectList)
      if (projectList.length > 0) setNewProject(projectList[0].id)
    }).catch(() => { setIdeas([]) })
  }, [])

  const visible = (ideas ?? []).filter((i) => {
    if (filter !== 'all' && i.status !== filter) return false
    if (projectFilter !== 'all' && i.projectId !== projectFilter) return false
    return true
  })

  const handleAdd = useCallback(async () => {
    if (!newTitle.trim() || !newProject || adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProject, title: newTitle.trim() }),
      })
      if (!res.ok) return
      const created: Idea = await res.json()
      setIdeas((prev) => [created, ...(prev ?? [])])
      setNewTitle('')
    } finally {
      setAdding(false)
    }
  }, [newTitle, newProject, adding])

  const cycleStatus = useCallback(async (idea: Idea) => {
    const next = STATUS_CYCLE[idea.status ?? 'idea']
    setIdeas((prev) => (prev ?? []).map((i) => i.id === idea.id ? { ...i, status: next } : i))
    await fetch(`/api/ideas/${idea.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => {})
  }, [])

  const deleteIdea = useCallback(async (id: number) => {
    setIdeas((prev) => (prev ?? []).filter((i) => i.id !== id))
    await fetch(`/api/ideas/${id}`, { method: 'DELETE' }).catch(() => {})
  }, [])

  const copyForClaude = useCallback(() => {
    const open = (ideas ?? []).filter((i) => i.status !== 'done')
    const byProject: Record<string, Idea[]> = {}
    for (const idea of open) {
      byProject[idea.projectId] = [...(byProject[idea.projectId] ?? []), idea]
    }
    const lines = Object.entries(byProject).flatMap(([pid, items]) => [
      `### Ideas — ${pid}`,
      ...items.map((i) => `- [ ] ${i.status === 'in-progress' ? '(in-progress) ' : ''}${i.title}`),
    ])
    navigator.clipboard?.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }, [ideas])

  const STATUSES = ['all', 'idea', 'in-progress', 'done']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Ideas</h1>
          <Badge variant="outline">{(ideas ?? []).filter((i) => i.status !== 'done').length} open</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={copyForClaude}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? 'Copied!' : 'Copy for Claude'}
        </Button>
      </div>

      {/* Add form */}
      <div className="flex gap-2">
        <Input
          placeholder="New idea…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <select
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          className="px-3 py-2 rounded-md border border-border bg-background text-sm"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <Button onClick={handleAdd} disabled={adding} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1 rounded-full text-xs border transition-colors capitalize',
              filter === s
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-border text-muted-foreground hover:border-foreground'
            )}
          >
            {s}
          </button>
        ))}
        {projects.length > 1 && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1 rounded-full text-xs border border-border bg-background ml-auto"
          >
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {ideas === null ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground text-sm">No ideas match the filter.</p>
        ) : visible.map((idea) => (
          <div key={idea.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
            <button
              onClick={() => cycleStatus(idea)}
              className={cn('text-xs px-2 py-0.5 rounded border capitalize shrink-0 mt-0.5', STATUS_STYLES[idea.status ?? 'idea'])}
            >
              {idea.status ?? 'idea'}
            </button>
            <span className={cn('flex-1 text-sm', idea.status === 'done' && 'line-through text-muted-foreground')}>
              {idea.title}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">{idea.projectId}</span>
            <button onClick={() => deleteIdea(idea.id)} className="text-muted-foreground hover:text-destructive text-xs shrink-0">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Add Ideas to the sidebar**

In `src/components/sidebar.tsx`, add `Lightbulb` to the lucide import line, then add to the `Debug` group (after Bug Tracker):

```typescript
{ href: '/ideas', label: 'Ideas', icon: Lightbulb, roles: ALL_ROLES },
```

**Step 3: Commit**

```bash
git add src/app/(dashboard)/ideas/page.tsx src/components/sidebar.tsx
git commit -m "feat: add Ideas dashboard page and sidebar nav"
```

---

## Task 9: DevToolsProjectPanel shared component

**Files:**
- Create: `src/components/devtools-panel/index.tsx`

**Step 1: Create the component**

Create `src/components/devtools-panel/index.tsx`:

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Bug {
  id: number
  title: string
  severity: string | null
  status: string | null
  pageUrl: string | null
  stackTrace: string | null
  createdAt: string | null
}

interface Idea {
  id: number
  title: string
  status: string | null
  createdAt: string | null
}

interface DevToolsProjectPanelProps {
  projectId: string
  apiBase: string
  apiKey: string
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-900/50 text-red-300 border-red-700',
  high: 'bg-orange-900/50 text-orange-300 border-orange-700',
  medium: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  low: 'bg-blue-900/50 text-blue-300 border-blue-700',
}

function buildClaudeContext(projectId: string, bugs: Bug[], ideas: Idea[]): string {
  const date = new Date().toISOString().slice(0, 10)
  const openBugs = bugs.filter((b) => b.status === 'open' || b.status === 'in-progress')
  const openIdeas = ideas.filter((i) => i.status !== 'done')

  const bugLines = openBugs.map((b) => {
    let line = `- [ ] [${(b.severity ?? 'medium').toUpperCase()}] ${b.title}`
    if (b.pageUrl) line += `\n      Page: ${b.pageUrl}`
    if (b.stackTrace) line += `\n      Stack: ${b.stackTrace.slice(0, 120)}...`
    return line
  })

  const ideaLines = openIdeas.map((i) => {
    const prefix = i.status === 'in-progress' ? '- [ ] (in-progress)' : '- [ ]'
    return `${prefix} ${i.title}`
  })

  const sections: string[] = [
    `## Project: ${projectId} — Open Items (${date})`,
    '',
    `### Bugs (${openBugs.length} open)`,
    ...bugLines,
    '',
    `### Ideas (${openIdeas.length})`,
    ...ideaLines,
  ]
  return sections.join('\n')
}

export function DevToolsProjectPanel({ projectId, apiBase, apiKey }: DevToolsProjectPanelProps) {
  const [bugs, setBugs] = useState<Bug[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedBug, setExpandedBug] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const headers = { 'x-devtools-api-key': apiKey }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${apiBase}/api/bugs?project=${projectId}&status=open`, { headers }).then((r) => r.json()),
      fetch(`${apiBase}/api/ideas?projectId=${projectId}`, { headers }).then((r) => r.json()),
    ])
      .then(([bugList, ideaList]) => {
        setBugs(bugList ?? [])
        setIdeas(ideaList ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, apiBase, apiKey])

  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(key)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {})
  }, [])

  if (loading) {
    return <div className="text-sm text-muted-foreground py-4">Loading…</div>
  }

  const openBugs = bugs.filter((b) => b.status === 'open' || b.status === 'in-progress')
  const openIdeas = ideas.filter((i) => i.status !== 'done')

  return (
    <div className="space-y-6">
      {/* Bugs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Bugs <span className="text-muted-foreground">({openBugs.length} open)</span></h3>
          <button
            onClick={() => copyText(buildClaudeContext(projectId, bugs, []), 'bugs')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {copiedId === 'bugs' ? 'Copied!' : 'Copy bugs for Claude'}
          </button>
        </div>
        <div className="space-y-2">
          {openBugs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No open bugs.</p>
          ) : openBugs.map((bug) => (
            <div key={bug.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex items-start gap-2">
                <span className={cn('text-xs px-1.5 py-0.5 rounded border shrink-0 capitalize', SEVERITY_STYLES[bug.severity ?? 'medium'])}>
                  {bug.severity ?? 'medium'}
                </span>
                <span className="flex-1">{bug.title}</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => copyText(`[${(bug.severity ?? 'medium').toUpperCase()}] ${bug.title}${bug.pageUrl ? '\nPage: ' + bug.pageUrl : ''}${bug.stackTrace ? '\nStack: ' + bug.stackTrace.slice(0, 200) : ''}`, `bug-${bug.id}`)}
                    className="text-xs text-muted-foreground hover:text-foreground px-1"
                  >
                    {copiedId === `bug-${bug.id}` ? '✓' : 'Copy'}
                  </button>
                  {bug.stackTrace && (
                    <button
                      onClick={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
                      className="text-xs text-muted-foreground hover:text-foreground px-1"
                    >
                      {expandedBug === bug.id ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>
              {bug.pageUrl && <p className="text-xs text-muted-foreground mt-1">{bug.pageUrl}</p>}
              {expandedBug === bug.id && bug.stackTrace && (
                <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded p-2 overflow-auto max-h-40">{bug.stackTrace}</pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ideas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Ideas <span className="text-muted-foreground">({openIdeas.length} active)</span></h3>
          <button
            onClick={() => copyText(buildClaudeContext(projectId, [], ideas), 'ideas')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {copiedId === 'ideas' ? 'Copied!' : 'Copy ideas for Claude'}
          </button>
        </div>
        <div className="space-y-1">
          {openIdeas.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active ideas.</p>
          ) : openIdeas.map((idea) => (
            <div key={idea.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 group">
              <span className={cn('text-xs w-20 shrink-0', idea.status === 'in-progress' ? 'text-indigo-400' : 'text-muted-foreground')}>
                {idea.status}
              </span>
              <span className="flex-1 text-sm">{idea.title}</span>
              <button
                onClick={() => copyText(idea.title, `idea-${idea.id}`)}
                className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground px-1"
              >
                {copiedId === `idea-${idea.id}` ? '✓' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Copy all */}
      <button
        onClick={() => copyText(buildClaudeContext(projectId, bugs, ideas), 'all')}
        className="w-full py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
      >
        {copiedId === 'all' ? '✓ Copied!' : 'Copy all for Claude'}
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/devtools-panel/index.tsx
git commit -m "feat: add DevToolsProjectPanel shared component"
```

---

## Task 10: Update /start skill to sync ideas on session start

**Files:**
- Modify: `~/.claude/skills/start.md`

**Step 1: Read the current start skill**

```bash
cat ~/.claude/skills/start.md
```

**Step 2: Add ideas sync step**

Find the section after the branch check and before "Load context" (or at the end of the setup steps). Add:

```markdown
### Ideas Sync (new step)

After confirming branch, fetch open ideas from DevTools and write to `~/.claude/ideas.md`:

1. Detect project ID:
   - Read `.devtools-project` in current repo root (`cat .devtools-project 2>/dev/null`)
   - If not found, check MEMORY.md for "Active Project:" line to infer project ID
   - If still unclear, skip sync and note it

2. Fetch ideas:
   ```bash
   DEVTOOLS_API_KEY=$(op read "op://App Dev/#devtools / DEVTOOLS_API_KEY/credential")
   curl -s "https://devtools.jbcloud.app/api/ideas?projectId=<id>&status=idea,in-progress" \
     -H "x-devtools-api-key: $DEVTOOLS_API_KEY" | jq .
   ```

3. Write to `~/.claude/ideas.md` in standard /ideas format:
   ```markdown
   ### [Project] Idea Title
   **Added:** YYYY-MM-DD
   **Status:** Idea | In Progress
   ```

4. Also record current sync hash:
   ```bash
   echo "<project_id>:<timestamp>" > ~/.claude/.ideas-sync-meta
   ```

5. Confirm: "Synced N ideas from DevTools (<projectId>)"
```

**Step 3: Commit the updated skill**

```bash
git -C ~/.21st/repos/Aventerica89/claude-codex add skills/start.md 2>/dev/null || true
# Or wherever your claude-codex skills live — check git remote
```

---

## Task 11: Update /end skill to push new ideas on session end

**Files:**
- Modify: `~/.claude/skills/end.md`

**Step 1: Read the current end skill**

```bash
cat ~/.claude/skills/end.md
```

**Step 2: Add ideas push step**

Find the pre-shutdown cleanup section. Add before final shutdown:

```markdown
### Ideas Push (new step)

Before session ends, push any ideas added locally to DevTools:

1. Read `~/.claude/ideas.md`
2. Read `~/.claude/.ideas-sync-meta` for last sync project + timestamp
3. Find entries newer than last sync timestamp
4. For each new entry, POST to DevTools:
   ```bash
   DEVTOOLS_API_KEY=$(op read "op://App Dev/#devtools / DEVTOOLS_API_KEY/credential")
   curl -sX POST "https://devtools.jbcloud.app/api/ideas" \
     -H "Content-Type: application/json" \
     -H "x-devtools-api-key: $DEVTOOLS_API_KEY" \
     -d '{"projectId":"<id>","title":"<title>","status":"idea"}'
   ```
5. Update `~/.claude/.ideas-sync-meta` with new timestamp
6. Confirm: "Pushed N new ideas to DevTools (<projectId>)"
```

---

## Task 12: Create /devtools-install-panel skill

**Files:**
- Create: `~/.claude/skills/devtools-install-panel.md`

**Step 1: Create the skill file**

Create `~/.claude/skills/devtools-install-panel.md`:

````markdown
# /devtools-install-panel

Install the DevToolsProjectPanel into any JB Cloud Next.js app's settings page.

## What This Does

1. Creates `.devtools-project` in repo root with `{ "projectId": "<id>" }`
2. Copies `DevToolsProjectPanel` component source to `src/components/devtools-panel/index.tsx`
3. Creates `src/app/(dashboard)/settings/devtools/page.tsx`
4. Adds "DevTools" nav item to the settings layout
5. Updates `.env.local.tpl` with DEVTOOLS_API_KEY and NEXT_PUBLIC_DEVTOOLS_PROJECT_ID
6. Stores DEVTOOLS_API_KEY in 1Password (App Dev vault) if not already there
7. Deploys env vars to Vercel

## Steps

### 1. Detect or prompt for project ID

```bash
cat .devtools-project 2>/dev/null
```

If missing: ask user "What is the DevTools project ID for this app?" (e.g., `clarity`, `wp-dispatch`, `vaporforge`).

Create `.devtools-project`:
```json
{ "projectId": "<id>" }
```

### 2. Copy DevToolsProjectPanel

Read the component source from `~/devtools/src/components/devtools-panel/index.tsx`.
Write it to `src/components/devtools-panel/index.tsx` in the current repo.

### 3. Create settings/devtools page

Create `src/app/(dashboard)/settings/devtools/page.tsx`:

```tsx
import { DevToolsProjectPanel } from '@/components/devtools-panel'

export default function DevToolsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">DevTools</h2>
        <p className="text-sm text-muted-foreground">
          Open bugs and active ideas for this project.
        </p>
      </div>
      <DevToolsProjectPanel
        projectId={process.env.NEXT_PUBLIC_DEVTOOLS_PROJECT_ID!}
        apiBase="https://devtools.jbcloud.app"
        apiKey={process.env.DEVTOOLS_API_KEY!}
      />
    </div>
  )
}
```

### 4. Inject nav item into settings layout

Find the settings layout file:
```bash
find src/app -name "layout.tsx" | xargs grep -l "settings\|Settings" | head -5
```

Read the layout. Find where settings nav items are listed (look for array of `{ href, label }` objects or similar). Add:

```typescript
{ href: '/settings/devtools', label: 'DevTools' }
```

**Idempotent check:** grep for `devtools` in the layout first — skip if already present.

### 5. Update .env.local.tpl

Append to `.env.local.tpl`:

```
DEVTOOLS_API_KEY={{ op://App Dev/#devtools / DEVTOOLS_API_KEY/credential }}
NEXT_PUBLIC_DEVTOOLS_PROJECT_ID=<projectId>
```

**Idempotent check:** grep for `DEVTOOLS_API_KEY` first — skip if already present.

### 6. 1Password check

Call `list_api_keys` searching for `DEVTOOLS_API_KEY`.
If not found: ask user "Please paste the DevTools API key" → `store_api_key` under
title `#devtools / DEVTOOLS_API_KEY` in App Dev vault with tag `env-var`.

### 7. Deploy env vars to Vercel

Call `deploy_env_vars` with:
- `DEVTOOLS_API_KEY` (sensitive)
- `NEXT_PUBLIC_DEVTOOLS_PROJECT_ID` (public, value = projectId)

### 8. Confirm

Print summary:
```
✓ .devtools-project created
✓ DevToolsProjectPanel component installed
✓ settings/devtools page created
✓ Settings nav updated
✓ .env.local.tpl updated
✓ Env vars deployed to Vercel
```

## Idempotent

Re-running updates the component file in place. Skips nav injection and env
template additions if already present.
````

**Step 2: Commit**

```bash
git -C ~/.21st/repos/Aventerica89/claude-codex add skills/devtools-install-panel.md
git -C ~/.21st/repos/Aventerica89/claude-codex commit -m "feat: add /devtools-install-panel skill"
```

---

## Task 13: Deploy and smoke test

**Step 1: Run full test suite**

```bash
cd ~/devtools && npm test
```

Expected: All existing tests pass + new ideas tests pass.

**Step 2: Build check**

```bash
cd ~/devtools && npm run build
```

Expected: No TypeScript errors, build completes.

**Step 3: Deploy to Vercel**

```bash
cd ~/devtools && git push
```

Watch Vercel deploy at devtools.jbcloud.app.

**Step 4: Smoke test widget**

- Open any app that embeds the widget (e.g., clarity.jbcloud.app in dev)
- Confirm `☆ Ideas` tab appears
- Add an idea, confirm it appears in the DevTools dashboard at `/ideas`
- Cycle status on the idea, confirm it updates

**Step 5: Smoke test dashboard**

- Open `devtools.jbcloud.app/ideas`
- Confirm the idea from Step 4 is listed
- Add another idea from the dashboard
- Click "Copy for Claude", paste into a text editor to verify markdown format

**Step 6: Final commit**

```bash
git add -A && git commit -m "chore: final smoke test verification"
```
