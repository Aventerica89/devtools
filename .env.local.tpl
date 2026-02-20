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
