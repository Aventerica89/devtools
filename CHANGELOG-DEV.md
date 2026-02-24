# Developer Log

Technical log. Updated on every deploy.

<!-- Entries added automatically by deploy hook -->

### 2026-02-23 16:00 · c2460d6 · v0.0.0
FEAT     ideas — add copy-to-project for routine checklists

### 2026-02-23 15:27 · c09c89f · v0.0.0
CHORE    env — add DEVTOOLS_API_KEY to env template

### 2026-02-23 15:12 · 0478342 · v0.0.0
FEAT     widget — add DevToolsProjectPanel shared component

### 2026-02-23 15:11 · 674a3b1 · v0.0.0
FEAT     dashboard — add Ideas dashboard page and sidebar nav

### 2026-02-23 15:09 · ad72ddf · v0.0.0
FEAT     widget — wire Ideas tab into widget ToolPanel

### 2026-02-23 15:08 · 9b563c3 · v0.0.0
FEAT     widget — add IdeasTab widget component with optimistic UI

### 2026-02-23 15:05 · 01a3d0e · v0.0.0
FEAT     widget — add ideas methods to widget ApiClient

### 2026-02-23 15:05 · f25c8d2 · v0.0.0
FEAT     api — add PATCH and DELETE /api/ideas/[id]

### 2026-02-23 15:00 · 4ed09f7 · v0.0.0
FEAT     api — add GET and POST /api/ideas with multi-auth support

### 2026-02-23 14:58 · 3e82a64 · v0.0.0
FEAT     api — add IdeaSchema, IdeaUpdateSchema, and verifyApiKey helper

### 2026-02-23 14:57 · 67ed33c · v0.0.0
FEAT     schema — add ideas table to schema

### 2026-02-23 14:35 · b91e8cd · v0.0.0
DOCS     plans — add ideas panel implementation plan

### 2026-02-23 14:31 · 722c4cb · v0.0.0
DOCS     plans — add ideas panel + cross-app plugin design

### 2026-02-23 01:22 · 01804eb · v0.0.0
FIX      hub — parse title by Notion type, handle Notes as description

### 2026-02-23 01:08 · 5eb25ca · v0.0.0
FEAT     hub — add Notion Standards DB to KB panel

### 2026-02-22 20:32 · 491f41b · v0.0.0
FIX      widget — hide widget snippets on mobile viewports

### 2026-02-21 18:46 · 2e02651 · v0.0.0
CHORE    deploy — trigger redeploy after GitHub integration reconnect

### 2026-02-21 18:42 · 30df49c · v0.0.0
CHORE    deploy — trigger Vercel redeploy

### 2026-02-21 18:27 · ff3fdb1 · v0.0.0
FIX      api — consolidate plans upload into main route, fix intermittent 405

### 2026-02-21 17:39 · 9adfa40 · v0.0.0
FEAT     hub — plans-index.html upload and isolated HTML viewer

### 2026-02-21 17:24 · efa6e4a · v0.0.0
FEAT     hub — load Notion page blocks in KB modal

### 2026-02-21 14:27 · 3a9c573 · v0.0.0
FIX      build — create middleware.js stub for Vercel Turbopack compatibility

### 2026-02-21 14:02 · 4de2ee0 · v0.0.0
FIX      build — force webpack for production build to generate middleware.js

### 2026-02-21 13:56 · 27d5254 · v0.0.0
FIX      build — correct middleware NFT file format to array

### 2026-02-21 13:53 · d6fb0d4 · v0.0.0
FIX      build — add postbuild to create middleware.js.nft.json when Turbopack omits it

### 2026-02-21 06:47 · ffaceea · v0.0.0
FIX      build — revert build script to plain next build (--no-turbopack is not a valid flag)

### 2026-02-21 06:35 · 790b84c · v0.0.0
CHORE    deploy — trigger redeploy

### 2026-02-21 06:33 · 3126977 · v0.0.0
FIX      build — use webpack for prod build to fix middleware nft.json Vercel error

### 2026-02-21 06:30 · ad5c53d · v0.0.0
CHORE    deploy — trigger Vercel redeploy

### 2026-02-21 06:27 · 9e35848 · v0.0.0
FIX      build — use npm install --include=dev for widget build (Vercel skips devDeps in production)

### 2026-02-21 06:12 · 105a0ce · v0.0.0
FIX      hub — correct Notion Knowledge Base DB ID in hub KB route

### 2026-02-21 06:08 · 175a19d · v0.0.0
FIX      build — install widget deps before vite build (Vercel doesn't install subdirectory packages)

### 2026-02-21 05:59 · 9632008 · v0.0.0
CHORE    merge — resolve conflicts with security improvements, keep routines/hub features

### 2026-02-21 05:28 · 2a5b002 · v0.0.0
FIX      hub — correct Notion KB DB ID and add plans cache fallback for production

### 2026-02-21 05:14 · 603f13a · v0.0.0
FEAT     widget — pixel-perfect CSS sweep, indigo FAB, dark scrollbar, badge count, panel position

### 2026-02-21 05:02 · 8acd1da · v0.0.0
CHORE    widget — rebuild widget.js with horizontal tab panel design

### 2026-02-21 05:02 · 40c86ba · v0.0.0
FEAT     widget — redesign panel, horizontal tabs, domain name, badge counts, minimize

### 2026-02-21 04:47 · 13cc56f · v0.0.0
FEAT     core — devtools v2, routines, hub, widget copy+routines, dashboard polish

### 2026-02-21 04:43 · d703788 · v0.0.0
STYLE    sidebar — section contrast + bug/error badge counts on nav items

### 2026-02-21 04:39 · c575070 · v0.0.0
STYLE    dashboard — tighter table rows + monospace for data values across all log pages

### 2026-02-21 04:35 · bba8702 · v0.0.0
STYLE    dashboard — tighten card padding p-6 to p-4 across dashboard components

### 2026-02-21 04:33 · 2859ec2 · v0.0.0
FIX      widget — panel header flex-start so marginLeft auto works correctly on Copy for Claude button

### 2026-02-21 04:30 · 1962d36 · v0.0.0
FEAT     widget — Copy for Claude bundle button in widget panel header

### 2026-02-21 04:29 · 668772d · v0.0.0
FIX      widget — copyTabBtnStyle backgroundColor none to transparent (invalid CSS)

### 2026-02-21 04:26 · 0c84d9e · v0.0.0
FEAT     widget — row-level hover copy + tab-level copy buttons in all widget viewers

### 2026-02-21 04:22 · e3b0d14 · v0.0.0
REFACTOR widget — explicit stack line guard in formatErrorRow

### 2026-02-21 04:20 · 4c85271 · v0.0.0
FEAT     widget — widget copy utilities, row/tab formatters with tests

### 2026-02-21 04:17 · 0832ded · v0.0.0
REFACTOR widget — remove canSend stale closure risk in handleSend

### 2026-02-21 04:13 · 933ab31 · v0.0.0
FEAT     widget — AI tab auto-injects page context (errors, network issues, console) on first message

### 2026-02-21 04:09 · 8cbf905 · v0.0.0
FIX      widget — abort controller in routines tab, desc sort for active run, 404 guard on item update, dedup run guard

### 2026-02-21 04:05 · 0daab38 · v0.0.0
FIX      api — add routines to middleware widget routes, PIN auth on GET runs, safe PUT completedAt

### 2026-02-21 04:01 · 877154a · v0.0.0
FIX      widget — routines routes support widget PIN auth, active run fetch on mount, close run calls server

### 2026-02-21 03:55 · 96b7a3f · v0.0.0
FEAT     widget — Routines tab, active run with progress bar and snippet copy

### 2026-02-21 03:51 · 94123aa · v0.0.0
FIX      widget — snapshot URL cleanup, blobToWebP error handler, stream finally cleanup, health key tiebreaker

### 2026-02-21 03:48 · 1863d18 · v0.0.0
FIX      widget — fix health listener splice bug, idempotent install, storage sandbox safety, stable keys

### 2026-02-21 03:43 · 99f00f6 · v0.0.0
FIX      widget — Snapshot v2, paste to WebP canvas, stop stream before draw, 1440px cap, download note

### 2026-02-21 03:41 · 94fc806 · v0.0.0
FEAT     widget — Health tab, broken images, mixed content, missing alt, slow resources

### 2026-02-21 03:40 · 169cc6d · v0.0.0
FEAT     widget — Storage tab, captures localStorage/sessionStorage/cookies on open

### 2026-02-21 03:37 · 1d5119b · v0.0.0
FIX      widget — command palette clipboard error handling, HTTP status checks, double-init guard

### 2026-02-21 03:33 · d778b12 · v0.0.0
FIX      widget — cmd+shift+K palette closes on Escape, robust key check

### 2026-02-21 03:31 · 2b00ae4 · v0.0.0
FEAT     widget — cmd+shift+K Shadow DOM command palette

### 2026-02-21 03:30 · ab303db · v0.0.0
FEAT     dashboard — cmd+K command palette with KB search + category filter chips

### 2026-02-21 03:27 · d94923e · v0.0.0
FIX      hub — Hub page error handling, controlled input, stable keys

### 2026-02-21 03:24 · 218a722 · v0.0.0
FIX      hub — NotionPanel date on cards + full-page Dialog modal

### 2026-02-21 03:21 · 9092a3b · v0.0.0
FEAT     hub — PlansPanel, local plans-index.html viewer

### 2026-02-21 03:21 · 365c8b9 · v0.0.0
FEAT     hub — NotionPanel, searchable KB cards with refresh + detail modal

### 2026-02-21 03:21 · a85dd0c · v0.0.0
FEAT     hub — Hub page shell with stats strip

### 2026-02-21 03:16 · 6904bef · v0.0.0
FEAT     routines — ChecklistEditor, items CRUD + run history with live check-off

### 2026-02-21 03:16 · 234f4bf · v0.0.0
FEAT     routines — two-panel layout, project selector + checklist list

### 2026-02-21 03:16 · c0b6063 · v0.0.0
FEAT     routines — page shell + Resources sidebar section

### 2026-02-21 03:10 · 260a574 · v0.0.0
FEAT     api — /api/hub/kb (Notion cache, 1h TTL) and /api/hub/plans (dev-only local file)

### 2026-02-21 03:04 · 30786c6 · v0.0.0
FEAT     api — full Routines runs API (create/check/close run lifecycle)

### 2026-02-21 03:04 · 37418f6 · v0.0.0
FEAT     api — /api/routines/[id] CRUD + /api/routines/[id]/items routes

### 2026-02-21 03:00 · 80283e5 · v0.0.0
FIX      api — add try/catch error handling to routines route

### 2026-02-21 02:58 · 9d117e9 · v0.0.0
FEAT     api — GET + POST /api/routines for checklist list/create

### 2026-02-21 02:56 · dd459b0 · v0.0.0
FEAT     api — add Routines + Hub Zod schemas to api.ts

### 2026-02-21 02:53 · 7e73b5b · v0.0.0
FEAT     schema — add Routines + hubCache tables, widgetConfig enabledTabs/screenshotFolder columns

### 2026-02-21 02:41 · 2983c16 · v0.0.0
DOCS     plans — add DevTools v2 implementation plan (8 phases, 2672 lines)

### 2026-02-21 02:00 · 5f6f812 · v0.0.0
DOCS     design — add snapshot v2 fixes to devtools v2 design

### 2026-02-21 01:46 · 05af3fe · v0.0.0
DOCS     design — add copy-for-claude system to DevTools v2 design

### 2026-02-21 01:25 · 14f64e4 · v0.0.0
DOCS     design — add DevTools v2 design doc, widget overhaul, routines, hub, command palette

### 2026-02-20 10:56 · 4543b30 · v0.0.0
FEAT     security — implement 18 security, performance, and reliability improvements

### 2026-02-19 17:49 · b7226b5 · v0.0.0
SECURITY api — remove ANTHROPIC_API_KEY env var fallback

### 2026-02-19 16:59 · a9a567e · v0.0.0
FEAT     widget — draggable panel, WebP captures, comments field, silent downloads

### 2026-02-19 01:52 · 61f6a82 · v0.0.0
CHORE    docs — add Clerk llmstxt skill files and update gitignore

### 2026-02-19 01:27 · 2774b2d · v0.0.0
FEAT     dashboard — add Dashboard home link and Changelog page to sidebar

### 2026-02-19 01:19 · 37f16c5 · v0.0.0
CHORE    changelog — initialize changelog (three-tier standard)

### 2026-02-19 01:02 · 2f02927 · v0.0.0
DOCS     core — add Clerk llmstxt skill reference to CLAUDE.md

### 2026-02-19 00:28 · 6e3deaa · v0.0.0
FIX      auth — proxy clerk oauth callback by not following redirects

### 2026-02-18 23:33 · 980feee · v0.0.0
FIX      auth — rename middleware to proxy.ts (Next.js 16) + strip content-encoding in clerk proxy

### 2026-02-18 23:25 · 5c6601d · v0.0.0
FEAT     auth — add Clerk sign-in and sign-up pages

### 2026-02-18 21:59 · a3c63f2 · v0.0.0
FEAT     auth — add Clerk proxy route handler for production auth

### 2026-02-18 19:27 · 392b769 · v0.0.0
FIX      auth — update middleware matcher to Clerk recommended pattern

### 2026-02-18 19:19 · cea3318 · v0.0.0
FEAT     auth — replace PIN auth with Clerk authentication

### 2026-02-18 18:22 · 38e8ccd · v0.0.0
FEAT     widget — debug snapshot saves screenshots to configured folder without per-file prompt

### 2026-02-18 18:07 · 0ade0fc · v0.0.0
FIX      api — join related tables in tracker API to populate App/Provider/Environment columns

### 2026-02-18 16:57 · c7228af · v0.0.0
FEAT     widget — add XHR interception to network log widget

### 2026-02-18 16:17 · 95b2b05 · v0.0.0
FEAT     auth — OAuth support + Error Log copy button

### 2026-02-18 15:46 · 59ae01c · v0.0.0
FEAT     widget — add Debug Snapshot tool to widget

### 2026-02-18 04:22 · 29a8e31 · v0.0.0
DOCS     core — add CLAUDE.md with full project context

### 2026-02-18 02:39 · b853c84 · v0.0.0
FEAT     dashboard — add page descriptions, pagination, project labels, and timezone-aware dates

### 2026-02-17 08:07 · 93cad78 · v0.0.0
DOCS     schema — phase 3c, add field-level comments to database schema

### 2026-02-17 08:06 · a277dbd · v0.0.0
TEST     api — phase 3b, add 43 new tests for crypto, api helpers, and route handlers

### 2026-02-17 08:03 · 414c006 · v0.0.0
FIX      api — phase 3a, pagination, validation, and error handling on remaining routes

### 2026-02-17 07:53 · d8912a5 · v0.0.0
FIX      security — phase 2, encryption, reliability, and DB indexes

### 2026-02-17 07:49 · 7377b75 · v0.0.0
FIX      security — phase 1 security hardening, validation, auth, and PIN verification

### 2026-02-17 07:44 · c958bec · v0.0.0
DOCS     plans — add improvement plan covering security, reliability, and quality

### 2026-02-15 02:17 · 6fe2146 · v0.0.0
FIX      widget — prevent widget event flood with buffer cap and self-filtering

### 2026-02-15 02:09 · 5302904 · v0.0.0
FIX      widget — send all console levels from widget to DevTools backend

### 2026-02-15 02:05 · 69f1897 · v0.0.0
FIX      api — add CORS support for widget AI endpoint

### 2026-02-15 01:10 · ed2547d · v0.0.0
FIX      widget — capture document.currentScript at module top-level in widget

### 2026-02-15 00:55 · 0a61aab · v0.0.0
FIX      api — add CORS support for widget cross-origin requests

### 2026-02-15 00:44 · 7952006 · v0.0.0
DOCS     core — add CHANGELOG.md with full project history

### 2026-02-15 00:21 · 2ce7cd8 · v0.0.0
FEAT     widget — stream console and network data from widget to dashboard

### 2026-02-14 23:38 · 3456db0 · v0.0.0
FIX      theme — restore slate-blue tinted dark theme in CSS variables

### 2026-02-14 23:23 · 0f1b6f1 · v0.0.0
FEAT     settings — make AI API key input editable with DB persistence

### 2026-02-14 23:16 · b501cfa · v0.0.0
FIX      theme — replace 650+ hardcoded slate colors with shadcn CSS variable tokens

### 2026-02-14 21:19 · c27ad0d · v0.0.0
FIX      theme — add dark class to html element for shadcn dark theme

### 2026-02-14 21:15 · 6e30ec0 · v0.0.0
FEAT     dashboard — add console, network, and error log pages

### 2026-02-14 20:23 · 29e16df · v0.0.0
FIX      ci — resolve all ESLint errors for CI

### 2026-02-14 20:05 · 8edaf67 · v0.0.0
CHORE    ci — add GitHub Actions CI workflow

### 2026-02-14 19:16 · c7b7f38 · v0.0.0
CHORE    db — add Turso database configuration

### 2026-02-14 19:09 · 523d771 · v0.0.0
FEAT     dashboard — add dev button and dashboard overview

### 2026-02-14 19:05 · 7ec9c33 · v0.0.0
FEAT     dashboard — add mobile app companion mockup page

### 2026-02-14 19:03 · 22ecf89 · v0.0.0
FEAT     dashboard — add style guide page

### 2026-02-14 18:58 · 6670c0f · v0.0.0
FEAT     settings — add settings pages for projects, AI, and widget configuration

### 2026-02-14 18:50 · 1d8c3af · v0.0.0
FEAT     dashboard — add performance dashboard with web vitals trends

### 2026-02-14 18:44 · 948aec8 · v0.0.0
FEAT     widget — add widget event ingestion, config endpoint, and performance interceptor

### 2026-02-14 18:37 · dc53d20 · v0.0.0
FEAT     dashboard — add App Tracker integration with deployments dashboard

### 2026-02-14 18:33 · 9f163aa · v0.0.0
FEAT     api — add AI analysis and error explanation endpoints with widget integration

### 2026-02-14 18:21 · 955bfe2 · v0.0.0
FEAT     dashboard — add env var manager dashboard tool

### 2026-02-14 18:14 · c57f190 · v0.0.0
FEAT     dashboard — add color and CSS tools dashboard page

### 2026-02-14 18:09 · c2a0afa · v0.0.0
FEAT     dashboard — add regex tester dashboard tool

### 2026-02-14 18:04 · 4e45746 · v0.0.0
FEAT     dashboard — add JSON viewer dashboard tool

### 2026-02-14 18:00 · 413b578 · v0.0.0
FEAT     dashboard — add API tester dashboard tool

### 2026-02-14 13:15 · e1bf066 · v0.0.0
FEAT     widget — add error interceptor, overlay, bug reporter, and API client to widget

### 2026-02-14 13:06 · f98a91c · v0.0.0
FEAT     widget — add network interceptor and viewer to widget

### 2026-02-14 13:02 · cf8d869 · v0.0.0
FEAT     widget — add console interceptor and viewer to widget

### 2026-02-14 12:58 · 035b803 · v0.0.0
FEAT     widget — add floating button and tool panel to widget

### 2026-02-14 12:54 · 74dc7a5 · v0.0.0
FEAT     widget — set up Vite + Preact widget build pipeline

### 2026-02-14 01:14 · fd3f883 · v0.0.0
FEAT     api — add dev log API and dashboard timeline page

### 2026-02-14 01:09 · 00b2841 · v0.0.0
FEAT     dashboard — add bug tracker API and dashboard page

### 2026-02-14 01:03 · 325a4ab · v0.0.0
FEAT     dashboard — add project CRUD API and dashboard shell with sidebar navigation

### 2026-02-14 00:57 · e17d7c9 · v0.0.0
FEAT     auth — add PIN authentication with middleware, unlock page, and session tokens

### 2026-02-14 00:52 · eac2eb0 · v0.0.0
FEAT     schema — add database schema with Drizzle + Turso (5 tables)

### 2026-02-14 00:49 · 1845fc5 · v0.0.0
CHORE    scaffold — scaffold Next.js project with Tailwind, shadcn, Drizzle, vitest

### 2026-02-14 00:05 · 391966d · v0.0.0
DOCS     plans — add implementation plan (28 tasks across 7 phases)

### 2026-02-14 00:01 · e7c11ee · v0.0.0
DOCS     design — add DevTools design document
