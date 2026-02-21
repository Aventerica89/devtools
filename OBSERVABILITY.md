# Observability Setup Guide

## Error Tracking with Sentry

### 1. Install Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 2. Configure Sentry

The wizard will create:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Update `next.config.js`

### 3. Add Environment Variables

```env
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=devtools
SENTRY_AUTH_TOKEN=...
```

### 4. Usage

Error boundaries already have placeholders for Sentry:

```typescript
// src/components/error-boundary.tsx
if (typeof window !== 'undefined' && window.Sentry) {
  window.Sentry.captureException(error, {
    contexts: { react: { componentStack: errorInfo.componentStack } }
  })
}
```

## Performance Monitoring

### Vercel Analytics

Already on Vercel, enable in dashboard:
1. Go to project settings
2. Enable "Speed Insights"
3. Enable "Web Analytics"

Add to `src/app/layout.tsx`:

```typescript
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
```

## Structured Logging

Use the logger utility in `src/lib/logger.ts`:

```typescript
import { logger } from '@/lib/logger'

// In API routes
export async function GET(request: Request) {
  const start = Date.now()
  try {
    logger.info('Fetching bugs', { project: 'my-app' })
    const bugs = await db.select().from(bugs)
    logger.apiCall('GET', '/api/bugs', 200, Date.now() - start)
    return NextResponse.json(bugs)
  } catch (error) {
    logger.error('Failed to fetch bugs', error, { project: 'my-app' })
    return apiError(500, 'Failed to fetch bugs')
  }
}
```

## Uptime Monitoring

### Recommended Services

1. **Better Uptime** (free tier)
   - https://betteruptime.com
   - Monitor `/api/health` endpoint
   - Set up Slack/email alerts

2. **Vercel Monitoring** (built-in)
   - View in Vercel dashboard
   - Automatic error tracking
   - Performance metrics

### Health Check Endpoint

Create `/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await db.select().from(projects).limit(1)

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'disconnected',
        },
      },
      { status: 503 }
    )
  }
}
```

## Log Aggregation

### For Production Scale

Consider:
- **Axiom** (free tier): https://axiom.co
- **Datadog**: Full observability platform
- **Grafana Cloud**: Free tier with Loki for logs

### Environment Variables

```env
# Logging level: debug | info | warn | error
LOG_LEVEL=info

# Sentry
SENTRY_DSN=...

# Optional: Axiom/Datadog
AXIOM_TOKEN=...
AXIOM_DATASET=devtools
```

## Widget Monitoring

Track widget errors separately:

```typescript
// In widget code
try {
  // widget operations
} catch (error) {
  // Send to dashboard
  fetch('/api/devlog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-DevTools-Pin': widgetPin,
    },
    body: JSON.stringify({
      projectId,
      type: 'error',
      title: 'Widget Error',
      content: error.message,
      source: 'auto',
      metadata: {
        stack: error.stack,
        widgetVersion: '1.0.0',
      },
    }),
  })
}
```

## Alerts

Set up alerts for:
- 5xx errors > 10/min
- Response time > 2s
- Database connection failures
- Widget PIN verification failures (possible attack)
- Rate limit hits > 100/min

## Dashboards

Create Vercel dashboard to monitor:
- Request volume
- Error rate
- P95 response time
- Database query duration
- Widget event ingest rate
