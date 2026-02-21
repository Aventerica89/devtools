import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/** Tracked application — each project has its own widget config and data. */
export const projects = sqliteTable('projects', {
  /** User-defined slug, e.g. "my-app" — used as FK in all other tables. */
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  /** Optional homepage/staging URL for display purposes. */
  url: text('url'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

/** Bug reports filed by the widget or from the dashboard. */
export const bugs = sqliteTable('bugs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  /** Enum: 'low' | 'medium' | 'high' */
  severity: text('severity').default('medium'),
  /** Enum: 'open' | 'closed' | 'resolved' */
  status: text('status').default('open'),
  /** URL of an attached screenshot (uploaded externally). */
  screenshotUrl: text('screenshot_url'),
  stackTrace: text('stack_trace'),
  /** The page URL where the bug occurred. */
  pageUrl: text('url'),
  userAgent: text('user_agent'),
  /** JSON blob — arbitrary extra context captured by the widget. */
  metadata: text('metadata'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  /** Set when status transitions to 'resolved'. */
  resolvedAt: text('resolved_at'),
}, (t) => [
  index('bugs_project_id_idx').on(t.projectId),
])

/**
 * Developer log entries — covers console output, network requests, errors,
 * performance metrics, and manual notes added from the dashboard.
 */
export const devlog = sqliteTable('devlog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  /** Category: 'console' | 'network' | 'error' | 'perf' | 'note' | custom */
  type: text('type').notNull(),
  title: text('title').notNull(),
  /** Full message body or serialized payload. */
  content: text('content'),
  /** 'auto' = captured by widget; 'manual' = added from dashboard. */
  source: text('source').default('manual'),
  /** JSON blob — type-specific extra fields (e.g. HTTP status, metric name). */
  metadata: text('metadata'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => [
  index('devlog_project_id_idx').on(t.projectId),
])

/** HTTP requests saved from the API tester tool for replay. */
export const savedRequests = sqliteTable('saved_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** Optional — requests can be saved without a project context. */
  projectId: text('project_id').references(() => projects.id),
  name: text('name').notNull(),
  /** HTTP verb: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS */
  method: text('method').notNull(),
  url: text('url').notNull(),
  /** JSON object — key/value header pairs. */
  headers: text('headers'),
  /** Raw request body string. */
  body: text('body'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => [
  index('saved_requests_project_id_idx').on(t.projectId),
])

/** Per-project widget configuration and PIN authentication. */
export const widgetConfig = sqliteTable('widget_config', {
  /** Same as projects.id — one config row per project. */
  projectId: text('project_id').primaryKey().references(() => projects.id),
  /** JSON array of enabled tool names, e.g. ["console","network","bugs"]. */
  enabledTools: text('enabled_tools'),
  /** 'dark' | 'light' */
  theme: text('theme').default('dark'),
  /** Widget anchor position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' */
  position: text('position').default('bottom-right'),
  /** bcrypt hash of the widget access PIN. */
  pinHash: text('pin_hash').notNull(),
  /** JSON array of tab IDs, null = all enabled */
  enabledTabs: text('enabled_tabs'),
  /** nullable label for snapshot UI */
  screenshotFolder: text('screenshot_folder'),
  /** JSON array of allowed origins for CORS, e.g. ["https://example.com"]. Null = allow all (*) */
  allowedOrigins: text('allowed_origins'),
})

/**
 * Global key/value settings store.
 * Currently holds encrypted AI provider API keys
 * (key = 'ANTHROPIC_API_KEY' | 'GOOGLE_GENERATIVE_AI_API_KEY').
 */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  /** AES-256-GCM encrypted value (see src/lib/crypto.ts). */
  value: text('value').notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
})

/** Environment variables managed from the dashboard for a project. */
export const envVars = sqliteTable('env_vars', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  /** Variable name — alphanumeric + underscores. Unique per project. */
  key: text('key').notNull(),
  value: text('value').notNull(),
  /** If true, the value should be masked in the UI. */
  sensitive: integer('sensitive', { mode: 'boolean' }).default(false),
  description: text('description'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (t) => [
  index('env_vars_project_id_idx').on(t.projectId),
  uniqueIndex('env_vars_project_key_idx').on(t.projectId, t.key),
])

/** Named checklists of routine maintenance tasks, grouped per project. */
export const routineChecklists = sqliteTable('routineChecklists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
})

/** Individual items within a routine checklist. */
export const routineItems = sqliteTable('routineItems', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checklistId: integer('checklist_id').notNull().references(() => routineChecklists.id),
  name: text('name').notNull(),
  type: text('type').notNull().default('maintenance'),
  snippet: text('snippet'),
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
})

/** A single execution run of a checklist for a project. */
export const routineRuns = sqliteTable('routineRuns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  checklistId: integer('checklist_id').notNull().references(() => routineChecklists.id),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
})

/** Per-item completion state within a routine run. */
export const routineRunItems = sqliteTable('routineRunItems', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: integer('run_id').notNull().references(() => routineRuns.id),
  itemId: integer('item_id').notNull().references(() => routineItems.id),
  checked: integer('checked').notNull().default(0),
  checkedAt: text('checked_at'),
})

/** Cache for external data fetched from Notion, plan files, etc. */
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
