# DevTools - Environment Variables Template
# Generate .env.local from 1Password: npm run env:inject

TURSO_DATABASE_URL={{ op://App Dev/#devtools / TURSO_DATABASE_URL/credential }}
TURSO_AUTH_TOKEN={{ op://App Dev/#devtools / TURSO_AUTH_TOKEN/credential }}

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY={{ op://App Dev/#devtools / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/credential }}
CLERK_SECRET_KEY={{ op://App Dev/#devtools / CLERK_SECRET_KEY/credential }}
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_CLERK_PROXY_URL=https://devtools.jbcloud.app/clerk-proxy

# DevTools API Key (for cross-app plugin + CLI ideas sync)
DEVTOOLS_API_KEY={{ op://App Dev/#devtools / DEVTOOLS_API_KEY/credential }}

# Deployment Platform Tokens (cross-app, shared across all projects)
VERCEL_API_TOKEN={{ op://App Dev/#cross-app / VERCEL_API_TOKEN/credential }}
CF_API_TOKEN={{ op://App Dev/#cross-app / CLOUDFLARE_API_TOKEN/credential }}
CF_ACCOUNT_ID=e2613c1c17024c32ab14618614e2b309
GITHUB_TOKEN={{ op://App Dev/#cross-app / GITHUB_TOKEN/credential }}
