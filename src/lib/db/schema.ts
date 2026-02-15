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

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
})

export const envVars = sqliteTable('env_vars', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: text('project_id').notNull().references(() => projects.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  sensitive: integer('sensitive', { mode: 'boolean' }).default(false),
  description: text('description'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
})
