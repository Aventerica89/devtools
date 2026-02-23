# Ideas Panel + Cross-App DevTools Plugin

**Date:** 2026-02-23
**Status:** Approved
**Scope:** DevTools (primary) + widget + `/devtools-install-panel` skill

---

## Problem

When working on an app in the browser, ideas surface in the moment but capturing them
requires a context switch — open DevTools dashboard, Apple Notes, a spreadsheet — by
which time the mental thread is gone. Bug reports exist in DevTools but are invisible
from within the source app, so feeding them to Claude requires another navigation hop.

---

## Solution Overview

1. Add an **Ideas tab** to the floating widget so ideas are captured on the spot, zero
   context switch, while the app is visible.
2. Store ideas in DevTools DB (single source of truth, alongside bugs).
3. Build a **`DevToolsProjectPanel`** React component that any app embeds in its
   settings page — shows bugs + ideas for that project with "Copy for Claude" buttons.
4. Auto-sync ideas into `~/.claude/ideas.md` as part of `/start` and `/end` so they
   are always in Claude Code context without manual steps.
5. Ship a **`/devtools-install-panel`** skill that wires the panel into any app's
   settings page in one command.

---

## Architecture

```
Browser (any app)
  └── widget.js (floating panel)
        └── Ideas tab → POST /api/ideas  ──┐
        └── Bugs tab  → POST /api/bugs    │
                                           ▼
                                   DevTools DB (Turso)
                                   ideas table
                                   bugs table
                                           │
               ┌───────────────────────────┤
               ▼                           ▼
  Other app settings page         DevTools dashboard
  <DevToolsProjectPanel>          /ideas page
  GET /api/ideas?projectId=X      (list + manage)
  GET /api/bugs?projectId=X
               │
               ▼
  "Copy for Claude" → markdown block → paste into Claude chat

Claude Code (terminal)
  /start → fetch ideas → ~/.claude/ideas.md
  /end   → push new local ideas → DevTools API
```

---

## Database

### New table: `ideas`

```sql
CREATE TABLE ideas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT    NOT NULL REFERENCES projects(id),
  title       TEXT    NOT NULL,
  body        TEXT,                          -- optional detail / notes
  status      TEXT    NOT NULL DEFAULT 'idea', -- 'idea' | 'in-progress' | 'done'
  tags        TEXT,                          -- JSON array of strings
  created_at  TEXT    DEFAULT (datetime('now')),
  updated_at  TEXT    DEFAULT (datetime('now'))
);
CREATE INDEX ideas_project_id_idx ON ideas(project_id);
```

---

## API Routes (DevTools)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/ideas?projectId=X` | API key | List ideas for project |
| POST | `/api/ideas` | API key or widget PIN | Create idea |
| PATCH | `/api/ideas/[id]` | API key | Update status / body |
| DELETE | `/api/ideas/[id]` | API key | Delete |

**Auth:** Widget uses existing PIN mechanism. CLI and settings plugin use a new
`DEVTOOLS_API_KEY` header stored in 1Password under `#devtools / DEVTOOLS_API_KEY`.

The key is checked via a shared `verifyApiKey(request)` helper added to `src/lib/api.ts`.

---

## Widget — Ideas Tab

**File:** `widget/src/tools/IdeasTab.tsx`

- Quick-capture input pinned to top: type title + Enter → saved immediately (optimistic)
- Idea list below: each row has status cycle button, title, inline delete
- Status cycle: `idea` (☆) → `in-progress` (◑) → `done` (✓) → back to `idea`
- "Copy for Claude" button at bottom: formats visible list as markdown checklist
- Badge on tab shows count of non-done ideas

**ToolPanel changes (`toolbar/ToolPanel.tsx`):**
- Add `{ id: 'ideas', label: 'Ideas', icon: '☆' }` to `TABS`
- Render `<IdeasTab>` when `activeTab === 'ideas'`
- Badge fed from idea count (polled every 5s alongside error/console badges)

---

## DevTools Dashboard — Ideas Page

**Path:** `src/app/(dashboard)/ideas/page.tsx`

- Sidebar nav entry: "Ideas" between Bugs and Routines
- Table grouped by project, filterable by status
- Inline status edit, body expand/edit, delete
- "Copy all open for Claude" exports full markdown context block
- Manually add ideas from dashboard (same form as widget, no PIN needed — Clerk session)

---

## DevToolsProjectPanel Component

**File:** `src/components/devtools-panel/index.tsx`

```tsx
interface DevToolsProjectPanelProps {
  projectId: string
  apiBase: string      // 'https://devtools.jbcloud.app'
  apiKey: string       // process.env.DEVTOOLS_API_KEY
}
```

Renders two sections:

**Bugs section**
- Open bugs sorted by severity (critical first)
- Each row: severity badge, title, page URL, collapsible stack trace
- "Copy" button per bug; "Copy all bugs for Claude" at section header

**Ideas section**
- Non-done ideas sorted by created_at desc
- Each row: status badge, title, promote-to-task button (sets status → in-progress)
- "Copy" button per idea; "Copy all ideas for Claude" at section header

**Footer**
- "Copy all for Claude" — single button producing the combined markdown context block:

```markdown
## Project: clarity — Open Items (2026-02-23)

### Bugs (2 open)
- [ ] [HIGH] Dashboard crashes on mobile
      Page: /dashboard | Stack: TypeError: Cannot read...
- [ ] [MEDIUM] Coach response cuts off mid-sentence

### Ideas (3)
- [ ] Add habit streaks to daily view
- [ ] Make task cards swipeable (in-progress)
- [ ] Dark/light mode toggle in quick settings
```

**Styling:** Uses the host app's Tailwind + shadcn tokens — no injected styles.
The component is a pure client component, no server dependencies.

---

## Claude Sync — /start + /end

### /start additions (after branch check)

```
1. Detect current project ID
   → read .devtools-project file in repo root (if present)
   → fallback: match package.json "name" against known project IDs in MEMORY.md
2. Fetch GET /api/ideas?projectId=<id>&status=idea,in-progress
   with DEVTOOLS_API_KEY from 1Password
3. Write ~/.claude/ideas.md (replace existing)
   Format: standard /ideas markdown with status and date
4. Confirm: "Synced N ideas from DevTools (clarity)"
```

### /end additions (before shutdown)

```
1. Read ~/.claude/ideas.md
2. Diff against last-synced state (stored in ~/.claude/.ideas-sync-hash)
3. POST any new ideas to DevTools /api/ideas
4. Update hash file
5. Confirm: "Pushed N new ideas to DevTools"
```

### .devtools-project file

A single-line JSON file in each app repo root:

```json
{ "projectId": "clarity" }
```

Created by `/devtools-install-panel`. Committed to git.

---

## /devtools-install-panel Skill

**File:** `~/.claude/skills/devtools-install-panel.md`

### What it does

1. **Read `.devtools-project`** — if missing, prompt for project ID and create the file
2. **Detect settings layout** — find `src/app/(dashboard)/settings/layout.tsx` or
   equivalent by searching for settings nav patterns
3. **Copy component** — write `src/components/devtools-panel/index.tsx` from template
4. **Create settings page** — write `src/app/(dashboard)/settings/devtools/page.tsx`
   rendering `<DevToolsProjectPanel>` bound to this project's ID
5. **Inject nav item** — add "DevTools" entry to the settings layout nav array/list
6. **Update env template** — append to `.env.local.tpl`:
   ```
   DEVTOOLS_API_KEY={{ op://App Dev/#devtools / DEVTOOLS_API_KEY/credential }}
   NEXT_PUBLIC_DEVTOOLS_PROJECT_ID=<projectId>
   ```
7. **1Password check** — `list_api_keys` for DEVTOOLS_API_KEY; store if missing
8. **Deploy env** — `deploy_env_vars` to Vercel for this project
9. **Confirm** — print summary of files created/modified

### Idempotent

Re-running updates the component file in place. Nav injection is skipped if the
"DevTools" entry already exists in the settings layout.

### Usage

```
/devtools-install-panel
```

Run from any app repo root. No arguments.

---

## Affected Files Summary

### DevTools repo (`~/devtools`)

```
src/lib/db/schema.ts              add ideas table definition
src/lib/db/migrations/            new migration file
src/lib/api.ts                    add verifyApiKey helper
src/app/api/ideas/route.ts        GET + POST
src/app/api/ideas/[id]/route.ts   PATCH + DELETE
src/app/(dashboard)/ideas/
  page.tsx                        Ideas dashboard page
  layout.tsx (or sidebar update)  Add nav entry
src/components/devtools-panel/
  index.tsx                       DevToolsProjectPanel component
widget/src/tools/IdeasTab.tsx     New widget tab
widget/src/toolbar/ToolPanel.tsx  Add Ideas tab registration
```

### Claude Code skills (`~/.claude/skills`)

```
devtools-install-panel.md         New skill
start.md                          Add ideas sync step
end.md                            Add ideas push step
```

### Per-app (after running /devtools-install-panel)

```
.devtools-project                 Project ID file
src/components/devtools-panel/index.tsx
src/app/(dashboard)/settings/devtools/page.tsx
src/app/(dashboard)/settings/layout.tsx  (modified)
.env.local.tpl                    (modified)
```

---

## Out of Scope

- Real-time push from DevTools to widget (polling is sufficient)
- Shared ideas across projects
- Idea voting or comments
- Mobile-native idea capture (widget is browser-only)
