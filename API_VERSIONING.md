# API Versioning Strategy

## Overview

This document outlines the API versioning strategy for the DevTools project to allow backward-compatible changes and future breaking changes without disrupting existing widget deployments.

## Current State

All API endpoints are currently unversioned:
- `/api/bugs`
- `/api/devlog`
- `/api/widget/event`
- etc.

## Recommended Strategy: URL-Based Versioning

### Advantages
- Clear and explicit version in URL
- Easy to test different versions
- No header inspection needed
- Widget can target specific version

### Implementation Plan

#### Phase 1: Add v1 Namespace (Non-Breaking)

1. **Duplicate routes under `/api/v1`**
   ```
   /api/v1/bugs
   /api/v1/devlog
   /api/v1/widget/event
   etc.
   ```

2. **Keep legacy routes** (redirect or proxy to v1)
   ```typescript
   // /app/api/bugs/route.ts
   import { GET as V1_GET, POST as V1_POST } from '../v1/bugs/route'

   export const GET = V1_GET
   export const POST = V1_POST
   ```

3. **Update widget** to use `/api/v1` endpoints (gradual rollout)

#### Phase 2: Deprecation Notice

Add deprecation headers to legacy routes:
```typescript
return NextResponse.json(data, {
  headers: {
    'X-API-Version': '1',
    'X-API-Deprecated': 'true',
    'X-API-Sunset': '2026-12-31', // RFC 8594
    'Link': '</api/v1/bugs>; rel="successor-version"',
  },
})
```

#### Phase 3: Remove Legacy Routes

After 6-12 months and widget update deployment:
- Remove unversioned routes
- All traffic goes through `/api/v1`

### Future Breaking Changes

When introducing breaking changes:

1. Create `/api/v2` routes
2. Update widget to use v2
3. Maintain v1 for 6-12 months
4. Deprecate and sunset v1

## Alternative: Header-Based Versioning

Not recommended for widget use case, but documented for reference:

```typescript
// Client sends:
headers: { 'X-API-Version': '1' }

// Server reads:
const version = request.headers.get('x-api-version') || '1'
```

**Downsides:**
- Less discoverable
- Harder to test
- Widget needs to manage headers

## Migration Examples

### Example 1: Change Event Schema

**v1** - Current format:
```json
{
  "projectId": "my-app",
  "type": "console",
  "title": "log message",
  "content": "detailed message"
}
```

**v2** - New format with structured data:
```json
{
  "projectId": "my-app",
  "eventType": "console",
  "message": "log message",
  "details": {
    "content": "detailed message",
    "level": "info",
    "timestamp": "2026-02-20T10:00:00Z"
  }
}
```

### Example 2: Widget Config Response

**v1**:
```json
{
  "enabledTools": ["console", "network"],
  "theme": "dark",
  "position": "bottom-right"
}
```

**v2** - With feature flags:
```json
{
  "tools": {
    "console": { "enabled": true, "maxEntries": 100 },
    "network": { "enabled": true, "captureHeaders": false }
  },
  "ui": {
    "theme": "dark",
    "position": "bottom-right",
    "showBadge": true
  }
}
```

## Version Discovery

Add `/api/version` endpoint:

```typescript
// /app/api/version/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    current: 'v1',
    supported: ['v1'],
    deprecated: [],
    sunset: {},
  })
}
```

## Changelog Tracking

Maintain `CHANGELOG_API.md`:

```markdown
# API Changelog

## v2 (Planned - 2026-Q4)
- **BREAKING**: Event schema changed to structured format
- **NEW**: Widget analytics endpoints
- **DEPRECATED**: Flat metadata object

## v1 (Current - 2026-02-20)
- Initial versioned release
- All existing endpoints
```

## Widget Update Strategy

1. **Deploy v1 API** alongside legacy routes
2. **Update widget** to target v1 (version in config)
3. **Monitor legacy usage** via logs
4. **Communicate sunset** to users via dashboard banner
5. **Remove legacy routes** after migration window

## Implementation Checklist

- [ ] Create `/api/v1` directory structure
- [ ] Duplicate all routes under v1
- [ ] Update widget to use v1 endpoints
- [ ] Add version discovery endpoint
- [ ] Add deprecation headers to legacy routes
- [ ] Document breaking change policy
- [ ] Create API changelog
- [ ] Set up version monitoring/logging
- [ ] Plan sunset timeline (6-12 months)

## Testing Strategy

Test both versions in parallel:

```bash
# v1
curl https://devtools.jbcloud.app/api/v1/bugs

# Legacy (should work identically)
curl https://devtools.jbcloud.app/api/bugs
```

## Best Practices

1. **Never break existing versions** - maintain compatibility within version
2. **Deprecate before removing** - minimum 6 month notice
3. **Document all changes** in CHANGELOG_API.md
4. **Version in URL**, not headers (for simplicity)
5. **Support N-1 versions** minimum (current + previous)
6. **Semantic versioning** for major breaks only (v1, v2, v3)
7. **Monitor version usage** - know when safe to sunset

## Current Status

**Status**: Not yet implemented
**Next Step**: Create `/api/v1` structure and begin phased rollout
**Timeline**: Q2 2026 for full v1 adoption
