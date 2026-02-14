# DevTools Design Document

**Date:** 2026-02-14
**Status:** Approved
**Author:** JB + Claude

## Overview

DevTools is a **universal embeddable developer toolkit SDK** — a floating toolbar that drops into any web app via a single `<script>` tag, plus a full dashboard at `devtools.jbcloud.app` for heavy tools. Upgrade once, all projects get the update.

## Problem

Developer debug tools are scattered across browser DevTools, separate apps, and project-specific implementations. DevTools consolidates them into a single embeddable toolkit that works universally across all JB Cloud projects.

## Target

Personal use (single developer). PIN-based auth, no accounts.

---

## Architecture: Monolith Dashboard + Widget Bundle

One Next.js repo produces two build outputs:

1. **Dashboard** — Next.js App Router on Vercel (`devtools.jbcloud.app`)
2. **Widget** — Vite + Preact bundle → `public/widget.js` (CDN-served)

```
Browser
├── Host App (any app)
│   └── widget.js (floating toolbar, shadow DOM)
└── DevTools Dashboard (devtools.jbcloud.app)
    └── Full tools UI, settings, dev log browser

Both call → devtools.jbcloud.app/api/*
             ├── /api/ai/*        → Claude / Gemini
             ├── /api/bugs        → Turso DB
             ├── /api/devlog      → Turso DB
             ├── /api/tracker/*   → Supabase (apps.jbcloud.app)
             └── /api/widget/*    → Config + event ingestion
```

### Widget Initialization

```html
<script src="https://devtools.jbcloud.app/widget.js"
        data-project="vaporforge"
        data-pin="sha256-hashed-pin"></script>
```

---

## Platform Decisions

| Decision | Choice |
|----------|--------|
| Framework | Next.js (App Router) |
| Database | Turso (SQLite) + Drizzle ORM |
| Auth | PIN passcode (bcrypt hash, httpOnly cookie) |
| Hosting | Vercel |
| UI | Tailwind + shadcn/ui |
| Icons | Lucide |
| Widget renderer | Preact (3KB) in Shadow DOM |
| Widget build | Vite |
| AI | Vercel AI SDK → Claude Sonnet + Gemini Flash |

## Style Guide

| Token | Value |
|-------|-------|
| Primary | Blue (#3b82f6 / blue-500) |
| Neutral | Slate (dark-first) |
| Success | Green-500 |
| Warning | Amber-500 |
| Error | Red-500 |
| Sans font | Inter |
| Mono font | JetBrains Mono |
| Border radius | 0.5rem (8px) |
| Dark mode | Primary (system fallback) |

---

## Widget Architecture

### Structure

```
widget/
├── index.ts              # Entry, creates shadow DOM root
├── toolbar/
│   ├── FloatingButton.tsx # Draggable FAB
│   └── ToolPanel.tsx      # Slide-out panel
├── tools/
│   ├── BugReporter.tsx    # Screenshot + annotate + submit
│   ├── ConsoleViewer.tsx  # Intercepted console output
│   ├── NetworkViewer.tsx  # Intercepted fetch/XHR
│   ├── ErrorOverlay.tsx   # Uncaught errors + stack trace
│   ├── PerfIndicator.tsx  # FPS, LCP/CLS/FID badges
│   ├── QuickAI.tsx        # Right-click → AI analyze
│   └── DevLogQuick.tsx    # Quick note entry
├── interceptors/
│   ├── console.ts         # Monkey-patches console.*
│   ├── network.ts         # Monkey-patches fetch + XHR
│   ├── errors.ts          # window.onerror + unhandledrejection
│   └── performance.ts     # PerformanceObserver for vitals
├── api/
│   └── client.ts          # Authenticated API calls
└── styles/
    └── widget.css         # Scoped (shadow DOM)
```

### Key Decisions

- **Shadow DOM** — CSS isolation from host app
- **Preact** — 3KB gzipped (vs 45KB React)
- **Interceptors activate on load** — immediate capture
- **Target: <80KB gzipped** total bundle
- **Heavy tools open dashboard** in new tab

### Widget vs Dashboard Tool Split

| Tool | Widget (in-app) | Dashboard (full page) |
|------|------------------|-----------------------|
| Bug Reporter | Quick capture + screenshot | Browse, manage, assign |
| Console Viewer | Live feed, filter | Full searchable history |
| Network Viewer | Live requests, timing | Saved requests, replay |
| Error Overlay | Auto-popup on error | Error trends, grouping |
| Perf Indicators | Live FPS/vitals | Lighthouse reports |
| AI Analysis | Right-click text | Full file analysis |
| Dev Log | Quick note entry | Full log browser |
| API Tester | - | Full HTTP client |
| JSON Viewer | - | Format, diff, transform |
| Regex Tester | - | Build + test patterns |
| Color/CSS Tools | - | Picker, gradients |
| Env Var Manager | - | View/edit across projects |
| App Tracker | Status badge | Full deployment history |

---

## Data Model (Turso/SQLite)

### Tables

**projects** — Registered projects
- id (PK), name, url, created_at

**bugs** — Bug reports from widget
- id, project_id (FK), title, description, severity, status
- screenshot_url, stack_trace, url, user_agent, metadata (JSON)
- created_at, resolved_at

**devlog** — Dev log entries (manual + auto)
- id, project_id (FK), type, title, content, source, metadata (JSON)
- created_at

**saved_requests** — API tester saved requests
- id, project_id, name, method, url, headers (JSON), body
- created_at

**widget_config** — Per-project widget settings
- project_id (PK), enabled_tools (JSON), theme, position, pin_hash

---

## API Design

### Auth
- `POST /api/auth/verify` — PIN → session cookie
- `DELETE /api/auth/logout` — Clear session

### Resources (CRUD)
- `/api/projects` — Project management
- `/api/bugs` — Bug tracking
- `/api/devlog` — Dev log entries
- `/api/requests` — Saved API requests

### AI
- `POST /api/ai/analyze` — Code/text analysis (streaming)
- `POST /api/ai/explain-error` — Error explanation

### Integration
- `GET /api/tracker/app/:id` — App Tracker proxy
- `GET /api/tracker/deployments` — Recent deployments

### Widget
- `GET /api/widget/config/:project` — Widget configuration
- `POST /api/widget/event` — Batch event ingestion

### Auth Model
All endpoints require either:
1. Session cookie (dashboard), OR
2. `X-DevTools-Pin` header (widget)

---

## Dashboard Layout

Sidebar navigation with tool categories:

- **Debug**: Bug Tracker, Console Log, Network Log, Error Log
- **Tools**: API Tester, JSON Viewer, Regex Tester, Color/CSS
- **Ops**: Deployments, Env Vars, Dev Log, Perf Audit
- **Settings**: Projects, AI Config, Widget Setup

Project context selector at top of content area.

---

## AI Integration

1. **AI Analyze** — User selects text → `/api/ai/analyze` → streaming Claude response
2. **AI Error Explainer** — Auto on uncaught errors → `/api/ai/explain-error`

Provider: Vercel AI SDK with Claude Sonnet (primary), Gemini Flash (fallback).
Keys stored in env vars on Vercel.

---

## App Tracker Integration

- Reads from apps.jbcloud.app Supabase (service role key in env)
- Shows: deployments, build status, git commits
- Matches project by name/repo
- Read-only

---

## Dev Log (Flight Recorder)

Two entry modes:
1. **Manual** — Quick notes from widget or full entries in dashboard
2. **Auto-capture** — Widget batches events (10s or 20 events):
   - Console errors/warnings
   - Network failures (4xx/5xx)
   - Poor web vitals (LCP > 2.5s, CLS > 0.1)
   - Unhandled exceptions

Dashboard: chronological timeline, filterable, searchable, exportable.

---

## Authentication (PIN Passcode)

- 4-6 digit PIN, bcrypt-hashed in DB
- Dashboard: PIN entry → httpOnly cookie (7-day expiry)
- Widget: SHA-256 hash in `data-pin` attribute → `X-DevTools-Pin` header
- No accounts, no OAuth
- Reset via CLI or direct DB access

---

## Mobile Companion App (Future)

**Platform:** React Native (Expo)

**Features:**
- Live dashboard (active projects, recent errors, deployment status)
- Push notifications (errors, failed deploys, perf degradation)
- Bug triage (review + update status)
- Dev log reader + quick notes

**Not on mobile:** API tester, JSON viewer, regex, color tools, env vars

**Auth:** Same PIN → JWT token

**Timeline:** After web MVP is stable.
