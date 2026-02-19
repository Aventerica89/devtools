# DevTools - Developer Tools Dashboard

A web-based developer tools dashboard with embeddable widget for capturing console, network, error, and performance data from external sites. Includes bug tracking, API tester, env var management, deployment viewer, and AI analysis features.

- **Live**: https://devtools.jbcloud.app
- **Repo**: Aventerica89/devtools

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui, Lucide icons
- **Database**: Turso (libSQL) + Drizzle ORM
- **AI**: Vercel AI SDK v6 + @ai-sdk/anthropic + @ai-sdk/google
- **Auth**: Clerk (email+password, Google, GitHub) — role-based: owner/dev/viewer
- **Widget Auth**: `X-DevTools-Pin` header (bcrypt hash comparison, cross-origin)
- **Widget**: Preact 10 + Vite (separate build, Shadow DOM)
- **Deployment**: Vercel (jb-cloud-apps team)

## Commands

```bash
npm run dev           # Next.js dev server
npm run build         # Production build
npm run test          # Vitest (run once)
npm run test:watch    # Vitest (watch mode)
npm run lint          # ESLint
npm run build:widget  # Build Preact widget (cd widget && vite build)
npm run env:inject    # Generate .env.local from 1Password template
npm run db:push       # Push Drizzle schema to Turso
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Sidebar layout group
│   │   ├── page.tsx          # Home dashboard (stats, recent bugs, activity)
│   │   ├── bugs/             # Bug tracker
│   │   ├── console/          # Console log viewer
│   │   ├── network/          # Network request log
│   │   ├── errors/           # Error log
│   │   ├── devlog/           # Dev log (all types)
│   │   ├── perf/             # Performance audit
│   │   ├── env/              # Environment variables
│   │   ├── deployments/      # Deployment viewer (Supabase integration)
│   │   ├── api-tester/       # HTTP request builder
│   │   ├── json/             # JSON viewer/formatter
│   │   ├── regex/            # Regex tester
│   │   ├── colors/           # Color picker, contrast checker, gradients
│   │   ├── style-guide/      # UI component style guide
│   │   ├── mobile-app/       # Mobile app preview (phone mockup)
│   │   └── settings/         # Projects, AI config, widget setup
│   ├── api/
│   │   ├── auth/             # verify (POST), logout
│   │   ├── bugs/             # CRUD + [id] routes
│   │   ├── devlog/           # CRUD + [id] routes
│   │   ├── env/              # GET/POST/PUT/DELETE env vars
│   │   ├── perf/             # GET perf entries (from devlog type=perf)
│   │   ├── projects/         # CRUD + [id] routes
│   │   ├── requests/         # Saved API requests CRUD
│   │   ├── proxy/            # Server-side HTTP proxy for API tester
│   │   ├── tracker/          # Deployments from JB Cloud App Tracker (Supabase)
│   │   ├── widget/           # event (batch ingest), config CRUD
│   │   └── ai/               # analyze, explain-error, keys, status, test
│   └── unlock/               # PIN entry page
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── sidebar.tsx           # Navigation sidebar (5 sections)
│   ├── bug-card.tsx          # Bug display card
│   ├── pagination-controls.tsx
│   ├── deployment-table.tsx  # Deployment list from App Tracker
│   ├── dashboard/            # stat-cards, recent-bugs, recent-activity
│   ├── perf/                 # score-cards, trend-chart, page-breakdown
│   ├── env/                  # env-var-list, env-compare, env-import
│   ├── settings/             # ai-provider-card, project-row, tool-checklist
│   └── style-guide/          # typography, buttons, cards, forms, etc.
├── lib/
│   ├── db/
│   │   ├── index.ts          # Turso/Drizzle client (lazy singleton via Proxy)
│   │   └── schema.ts         # All table definitions
│   ├── api.ts                # Zod schemas, parseBody, verifyWidgetPin, apiError
│   ├── auth.ts               # PIN hashing (bcrypt), session token create/verify
│   ├── auth.edge.ts          # Edge-compatible session verify (Web Crypto)
│   ├── crypto.ts             # AES-256-GCM encrypt/decrypt (hex IV:tag:ciphertext)
│   ├── ai-keys.ts            # AI key resolver (DB-stored > env var fallback)
│   ├── format-date.ts        # Date/time formatting (America/Phoenix timezone)
│   ├── color-utils.ts        # Color conversion utilities
│   └── utils.ts              # cn() class merge helper
├── middleware.ts              # Auth guard + CORS for widget endpoints
widget/                        # Embeddable Preact widget (separate package)
├── src/
│   ├── index.ts              # Shadow DOM mount, init interceptors
│   ├── api/client.ts         # API client (X-DevTools-Pin header auth)
│   ├── interceptors/         # console, network, errors, performance capture
│   ├── toolbar/              # FloatingButton, ToolPanel
│   └── tools/                # BugReporter, ConsoleViewer, NetworkViewer, etc.
├── vite.config.ts
└── package.json
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `projects` | Tracked apps (text PK slug, name, URL) |
| `bugs` | Bug reports (severity, status, stack trace, metadata) |
| `devlog` | Unified log (type: console/network/error/perf/note, source: auto/manual) |
| `savedRequests` | API tester saved requests (method, URL, headers, body) |
| `widgetConfig` | Per-project widget settings (enabled tools, theme, position, pinHash) |
| `settings` | Global KV store (encrypted AI API keys) |
| `envVars` | Per-project env vars (key, value, sensitive flag, unique per project) |

**Key**: Project IDs are user-defined text slugs (not integers). Bug/devlog/envVar IDs are auto-increment integers.

## API Endpoints

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[id]` | GET, PUT, DELETE | Project CRUD |
| `/api/bugs` | GET, POST | List (filter: project, status, limit) / create |
| `/api/bugs/[id]` | GET, PUT, DELETE | Bug CRUD |
| `/api/devlog` | GET, POST | List (filter: project, type, days, limit) / create |
| `/api/devlog/[id]` | GET, PUT, DELETE | Devlog CRUD |
| `/api/env` | GET, POST, PUT, DELETE | Env vars (filter by projectId) |
| `/api/perf` | GET | Perf entries (devlog type=perf, filter: projectId, days) |
| `/api/requests` | GET, POST | Saved API requests |
| `/api/requests/[id]` | GET, PUT, DELETE | Saved request CRUD |
| `/api/proxy` | POST | Server-side HTTP proxy for API tester |
| `/api/tracker` | GET | Deployments from Supabase App Tracker |
| `/api/widget/event` | POST | Batch event ingest (up to 100, PIN auth) |
| `/api/widget/config` | GET, POST | Widget config CRUD |
| `/api/widget/config/[project]` | GET, PUT | Per-project widget config |
| `/api/ai/analyze` | POST | Stream code analysis (Claude) |
| `/api/ai/explain-error` | POST | Stream error explanation |
| `/api/ai/keys` | GET, PUT, DELETE | AI provider key management (encrypted) |
| `/api/ai/status` | GET | AI availability check |
| `/api/ai/test` | POST | Test AI connection |

## Key Patterns

- **Widget PIN auth**: Widget sends bcrypt pinHash via `X-DevTools-Pin` header. Middleware allows widget paths (`/api/widget`, `/api/bugs`, `/api/ai`) with PIN header without session cookie. `verifyWidgetPin()` in `api.ts` compares header value against DB-stored hash.
- **Devlog as unified store**: Console, network, error, perf, and notes all go into `devlog` table with `type` field. Widget auto-captured entries have `source: 'auto'`, dashboard-created have `source: 'manual'`.
- **Pagination**: Client-side via `PaginationControls` component. API routes support `limit` and `offset` params with max 500 items.
- **Date formatting**: All dates use `America/Phoenix` timezone (see `format-date.ts`). Stored as ISO strings in SQLite.
- **AI key resolution**: `getAiKey()` checks DB `settings` table first (AES-256-GCM encrypted), falls back to env var.
- **Zod validation**: All POST/PUT bodies validated via `parseBody()` helper with typed Zod schemas in `api.ts`.
- **Edge middleware auth**: `auth.edge.ts` uses Web Crypto API for session verification (compatible with Vercel Edge Runtime). `auth.ts` uses Node crypto for token creation.
- **Project labels**: Sidebar sections are Debug (bugs, console, network, errors), Tools (API tester, JSON, regex, colors), Ops (deployments, env, devlog, perf), Dev (style guide, mobile app), Settings (projects, AI, widget).

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `TURSO_DATABASE_URL` | Yes | Turso database connection URL |
| `TURSO_AUTH_TOKEN` | Yes | Turso auth token |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (public) |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (server-only) |
| `ANTHROPIC_API_KEY` | No | Claude API key (fallback if not in DB) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Google AI key (fallback if not in DB) |
| `APP_TRACKER_SUPABASE_URL` | No | JB Cloud App Tracker Supabase URL |
| `APP_TRACKER_SERVICE_KEY` | No | Supabase service role key for deployments |

1Password template: `.env.local.tpl` (run `npm run env:inject` to generate `.env.local`).

## Anthropic OAuth Rule (STRICTLY ENFORCED)

**NEVER** use `@ai-sdk/anthropic` default behavior (`anthropic('model')`) for Claude API calls — it reads `ANTHROPIC_API_KEY` env var directly and does NOT support OAuth tokens.

**ALWAYS** use `@anthropic-ai/sdk` with `createClient()` pattern:
```ts
import Anthropic from '@anthropic-ai/sdk'
function createClient(token: string): Anthropic {
  if (token.startsWith('sk-ant-oat')) return new Anthropic({ authToken: token })
  return new Anthropic({ apiKey: token })
}
```
Fetch the token from DB first via `getAiKey('anthropic')`. OAuth tokens (`sk-ant-oat...`) and API keys (`sk-ant-api...`) are both supported.

## Gotchas

- **Widget PIN is a bcrypt hash comparison**, not plaintext. The widget embeds the hash and sends it as a header. The server compares it directly to the DB-stored hash (no re-hashing on the server side for widget requests).
- **Deployments page reads from external Supabase** (JB Cloud App Tracker), not the local Turso DB. Returns `{ configured: false }` gracefully when env vars are missing.
- **Clerk handles dashboard auth**. `clerkMiddleware()` in `middleware.ts` requires authentication on all routes except widget paths and sign-in. Roles (`owner`/`dev`/`viewer`) are stored in Clerk `publicMetadata.role` and control sidebar visibility.
- **Widget PIN is separate from Clerk** — widget scripts run cross-origin and send `X-DevTools-Pin` header. The middleware passes these through without Clerk auth. The `pinHash` stored in `widgetConfig` table is compared directly.
- **Setting user roles**: In Clerk Dashboard → Users → select user → Metadata → add `{ "role": "owner" }` to Public Metadata. Default role for new users is `viewer`.
- **CORS is wide open** (`Access-Control-Allow-Origin: *`) on widget endpoints to support cross-origin script embedding.
- **Cross-project batch events are rejected** to prevent PIN bypass by mixing projectIds in a single batch.
- **DB client uses Proxy** for lazy initialization -- avoids crashing at import time when env vars are missing.
- **Next.js 16 async params**: Route handlers use `{ params }: { params: Promise<{ id: string }> }` pattern.
- **Widget builds separately** in `widget/` directory with its own Vite config and Preact. Output goes to `public/widget.js`.
- **Encryption format**: `<hex IV>:<hex auth tag>:<hex ciphertext>` (3 colon-separated hex strings). `isEncrypted()` checks for this pattern before attempting decryption.

## Deployment

- **Platform**: Vercel
- **Project ID**: prj_D9spL0m5OOjqVm6uJwOj5bk180zs
- **Team**: jb-cloud-apps (team_W6zfVpiJ8QIRytp0OpvOX6D1)
- **URL**: https://devtools.jbcloud.app
- **Auto-deploys** on push to main
- **DB**: Shared Turso instance (also used by other JB Cloud projects)
