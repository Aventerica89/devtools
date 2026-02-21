# DevTools v2 — Design Document

**Date:** 2026-02-20
**Status:** Approved
**Scope:** Widget overhaul, Routines system, Hub page, Command palette, Copy for Claude system, Dashboard refresh

---

## Overview

Three interconnected features that together make DevTools a full-time dev companion — not just a dashboard you open occasionally:

1. **Widget v2** — Full devbar overhaul: new tabs, smarter passive capture, command palette accessible via `⌘⇧K` without opening the dashboard
2. **Routines** — Per-project maintenance checklists with run history, copy-paste snippets, managed from the dashboard
3. **Hub page** — Dashboard landing page: Notion KB viewer, Plans Index, quick stats, `⌘K` command palette

---

## 1. Widget v2

### Tab Bar

The floating panel gets a horizontal scrollable tab bar. Each tab is a lazy-loaded Preact component.

| Tab | Key | What it shows |
|-----|-----|---------------|
| Console | `console` | Captured logs with level badges (log/warn/error/info) |
| Network | `network` | XHR/fetch log — method, status, URL, duration |
| Errors | `errors` | Unhandled errors and promise rejections with stack traces |
| Perf | `perf` | Core Web Vitals scores + detailed metrics |
| Storage | `storage` | localStorage, sessionStorage, cookies (read-only snapshot on open) |
| DOM | `dom` | Click-to-inspect: computed styles, box model, ARIA role |
| Health | `health` | Passive scan: broken images, mixed content, missing alt, slow resources |
| Routines | `routines` | Active run for this project — check off items, copy snippets |
| AI | `ai` | Text input → Claude response with page context injected automatically |
| Bugs | `bugs` | Quick bug reporter + recent bugs for this project |
| Snapshot | `snapshot` | Existing DebugSnapshot (screenshot + devlog entry) |

The FAB shows a **badge count** — total of unread errors + health warnings.

### New Interceptors

**`storage.ts`**
Snapshots localStorage, sessionStorage, and document.cookie on panel open. No continuous polling. Refreshes on tab focus.

**`health.ts`**
Runs on DOMContentLoaded + a 30-second sweep:
- Broken images via `img.onerror`
- Mixed content via `SecurityPolicyViolationEvent`
- Missing alt text via `querySelectorAll('img:not([alt])')`
- Slow resources (>2s) from `PerformanceResourceTiming`
- CORS errors from failed fetch responses

### Widget Config Changes

New field on `widgetConfig` table: `enabledTabs` (JSON array of tab IDs). Lets you disable tabs per project from the dashboard Settings → Widget page. All tabs enabled by default.

### Command Palette in Widget

**Shortcut:** `⌘⇧K` (fires on the client site without opening DevTools dashboard)
**Implementation:** Shadow DOM overlay rendered inside the existing widget shadow root — fully isolated from the page's CSS
**Data source:** Reads from `hubCache` table via `/api/hub/kb?type=standards` — same cache the dashboard uses
**Behavior:** Fuzzy search, filter by category, copy button on each snippet, `Escape` closes

This means the command palette is available on any client site with the widget installed, without ever opening devtools.jbcloud.app.

---

## 2. Routines

### Dashboard Page: `/routines`

New sidebar entry under the **Resources** section. Full CRUD editor for per-project checklists.

**Left panel:** Project selector + list of checklists for that project
**Right panel:** Checklist editor with drag-to-reorder items, and a Run History tab

### Data Model

```
routineChecklists
  id            integer PK autoincrement
  projectId     text FK → projects.id
  name          text
  description   text
  sortOrder     integer

routineItems
  id            integer PK autoincrement
  checklistId   integer FK → routineChecklists.id
  name          text
  type          text  -- health | maintenance | pre-deploy | workflow
  snippet       text  -- copy-paste command (WP CLI, bash, curl, etc.)
  notes         text
  sortOrder     integer

routineRuns
  id            integer PK autoincrement
  projectId     text FK → projects.id
  checklistId   integer FK → routineChecklists.id
  startedAt     text  -- ISO string
  completedAt   text  -- ISO string, null until all items checked or manually closed

routineRunItems
  id            integer PK autoincrement
  runId         integer FK → routineRuns.id
  itemId        integer FK → routineItems.id
  checked       integer  -- 0 | 1
  checkedAt     text  -- ISO string, null until checked
```

### Run Lifecycle

1. User clicks **New Run** — creates a `routineRuns` record + one `routineRunItems` row per checklist item (all `checked: 0`)
2. User copies snippet → runs command in terminal → checks off item → `checkedAt` written
3. Progress bar = `checked / total`
4. Run closes when all items checked, or user manually closes it
5. `completedAt` is written on close

History view shows all past runs with timestamp, completion rate, and duration. Each run is expandable to see which items were checked and when.

### Health check auto-execution

Items with `type: health` and a snippet that is a URL (starts with `http`) can optionally auto-execute: the widget fetches the URL and marks the item green/red based on response status. Terminal commands remain manual check-off only.

### Widget Routines Tab

Shows the **active run** for the current project (matched by `widgetConfig.projectId`). If no run is active, shows a "Start Run" button with a checklist selector. Items display snippet with copy button inline.

---

## 3. Hub Page

### Location

New sidebar section **Resources** at the top of the nav, containing:
- Hub (landing page)
- Routines

### Layout

Two-column grid below a stats strip.

**Stats strip (full width):** Routines due, last deploy, open bugs, KB entry count — all from existing data, no new queries.

**Panel 1 — Notion Knowledge Base**
Fetches from DB `885cd9c275bd45bb93e17fe0f156d1b1` via Notion REST API.
Requires new env var: `NOTION_API_TOKEN`.
Cached in `hubCache` table (TTL 1 hour). Refresh button forces re-fetch.
Displays as a searchable card list: title, type badge, date.
Click → full-page modal with page content rendered as structured text (headings, paragraphs, code blocks).

**Panel 2 — Plans Index**
API route `GET /api/hub/plans` reads `~/Desktop/plans-index.html` via `fs.readFile(path.join(process.env.HOME, 'Desktop', 'plans-index.html'))`.
Dev-only: route returns `{ available: false }` when `NODE_ENV === 'production'`. Panel shows a graceful "Local file — not available in production" notice.
Displays as a list of plan rows parsed from the HTML (title, project, status, date).

### Command Palette (Dashboard)

**Shortcut:** `⌘K` anywhere in the DevTools dashboard
**Data:** Fetches from `hubCache` — entries where `source: 'notion'`. Refreshes automatically with the KB cache.
**UI:** Full-page overlay, fuzzy search input, filter chips (All / Standards / Git / API / Deploy), each entry shows title + description + snippet with copy button.

---

## 4. Dashboard Visual Refresh

While building the new pages, apply the tighter information density from the mockups to all existing pages:

- Reduce card padding from `p-6` → `p-4`
- Tighten table row heights
- Increase sidebar label contrast
- Apply consistent monospace font for all log/code values
- Badge counts on sidebar nav items (bugs, errors)

No structural changes — layout and routing stay the same. CSS/Tailwind class updates only.

---

## New API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/routines` | GET, POST | List/create checklists |
| `/api/routines/[id]` | GET, PUT, DELETE | Checklist CRUD |
| `/api/routines/[id]/items` | GET, POST | List/add items |
| `/api/routines/items/[id]` | PUT, DELETE | Item CRUD |
| `/api/routines/[id]/runs` | GET, POST | List/start runs |
| `/api/routines/runs/[runId]` | GET, PUT | Get/close run |
| `/api/routines/runs/[runId]/items` | PUT | Check/uncheck item |
| `/api/hub/kb` | GET | Notion KB entries (cached, `?type=` filter) |
| `/api/hub/plans` | GET | Local plans-index.html (dev only) |

---

## New DB Tables

```
hubCache
  id         integer PK autoincrement
  source     text   -- 'notion' | 'plans'
  cacheKey   text   -- unique identifier (notion page ID, 'plans-index')
  content    text   -- JSON blob
  fetchedAt  text   -- ISO string
```

Unique constraint on `(source, cacheKey)`.

---

## New Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NOTION_API_TOKEN` | Yes (for Hub) | Notion REST API integration token |

---

## Widget Keyboard Shortcut

| Context | Shortcut | Action |
|---------|----------|--------|
| DevTools dashboard | `⌘K` | Open command palette |
| Client site (widget) | `⌘⇧K` | Open command palette as Shadow DOM overlay |

---

## 5. Copy for Claude System

The widget is frequently used to capture context for pasting into Claude Code or claude.ai. Every piece of data in the widget needs to be copyable at two levels.

### Row-level copy

Every data row in every tab gets a copy icon that appears on hover. One click copies a single formatted string:

```
[ERROR] TypeError: Cannot read properties of undefined (reading 'price')
  at CartItem.render (cart.js:88:22)
  at renderComponents (react-dom.js:6421:14)
  Page: /products | 14:32:07
```

```
[NETWORK] POST /api/cart/add → 201  87ms  fetch
```

```
[WARN] Deprecated API used: window.webkitStorageInfo (vendor.js:234)
```

### Tab-level copy

Each tab has a "Copy [tab]" button in the tab content header that copies all entries in that tab as a formatted markdown block.

### "Copy for Claude" bundle

A **Copy for Claude** button in the widget panel header copies a full-page context bundle — everything relevant in one shot:

```markdown
## Page Context — wp-jupiter.com/products
**Captured:** 2026-02-20 14:32

### Errors (2)
- TypeError: Cannot read properties of undefined (reading 'price') — cart.js:88
- Unhandled rejection: NetworkError /api/analytics/track 503 — analytics.js:34

### Console Warnings (3)
- Deprecated API: window.webkitStorageInfo (vendor.js:234)
- Image lazy-load skipped: missing data-src on 2 elements (lazy.js:91)
- localStorage quota at 82% (storage.js:7)

### Network Issues (2)
- GET /api/recommendations/v2 → 404 (22ms)
- POST /api/analytics/track → 503 (1240ms)

### Health Issues (3)
- [ERROR] Mixed content: /images/legacy/banner.jpg loaded over HTTP
- [WARN] 2 images missing alt text
- [WARN] Slow resource: vendor.bundle.js 2.4s

### Performance
- Score: 91 | LCP: 1.2s | CLS: 0.18 | FID: 62ms
```

This is a single clipboard copy. Paste directly into Claude with no editing needed.

### Scope of copy buttons

| Location | What copies |
|----------|-------------|
| Every log row | Single formatted entry with level, message, source, timestamp |
| Every network row | Method, status, URL, type, duration |
| Every error row | Message + full stack trace + metadata |
| Every health item | Severity, description, detail |
| Every routine snippet | The raw snippet text only (for terminal pasting) |
| Tab header "Copy [tab]" | All entries in that tab as markdown list |
| Panel header "Copy for Claude" | Full bundle as shown above |

---

## 6. Snapshot Tab (v2 Fixes)

The existing `DebugSnapshot.tsx` has three root-cause bugs. Fix these during Phase 5 (Widget tabs):

### Fix 1 — Paste path always saves PNG

**Root cause:** `appendScreenshot` uses `item.getAsFile()` directly — clipboard images are always PNG because the OS clipboard doesn't preserve encoding.

**Fix:** Run pasted blobs through a canvas conversion before saving:
```ts
function blobToWebP(blob: Blob): Promise<Blob> {
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

### Fix 2 — Screen capture crashes on retina displays

**Root causes:**
1. Stream stays open while canvas draws from `<video>`, holding GPU memory
2. `MAX_WIDTH = 1920` on a 2× display means 3840px canvas — OOM on older Macs

**Fixes:**
- Stop stream tracks before drawing: `stream.getTracks().forEach(t => t.stop())` immediately after `video.play()` resolves — the video element retains the last frame
- Cap effective width at `1440` (sufficient for debugging, safe on all devices)

### Fix 3 — Download location

**Root cause:** `<a download>` always goes to the browser's Downloads folder. The `folderPath` stored in localStorage only appears in the report text — it never affected the actual save destination. Browser security prevents `<a download>` from targeting arbitrary paths.

**Fix:**
- Add `screenshotFolder` field to `widgetConfig` table (nullable text, default `null`)
- Configurable in DevTools Settings → Widget alongside other per-project widget options
- The actual download still goes to ~/Downloads (browser constraint — cannot be changed)
- Widget Snapshot tab shows: "Screenshots save to ~/Downloads · Set label in Settings"
- Report text includes the configured label as a note for context

---

## Implementation Order

| Phase | Scope |
|-------|-------|
| 1 — DB + API | New schema tables, all API routes, Notion cache |
| 2 — Routines dashboard | `/routines` page, checklist editor, run history |
| 3 — Hub page | Hub layout, Notion panel, Plans panel, stats strip |
| 4 — Command palette | Dashboard `⌘K` overlay, widget `⌘⇧K` Shadow DOM overlay |
| 5 — Widget tabs | Storage, DOM, Health interceptors + new tabs + Snapshot v2 fixes |
| 6 — Widget Routines + AI tabs | Active run in widget, AI chat tab with page context |
| 7 — Copy system | Row-level copy icons, tab-level copy buttons, "Copy for Claude" bundle |
| 8 — Dashboard refresh | Tighten density across all existing pages |

---

## Mockups

- Widget: `~/Desktop/devtools-widget-v2.html`
- Hub + Command palette: `~/Desktop/devtools-hub.html`
