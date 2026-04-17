import type { AuthConfig } from 'convex/server'

// Inline CLERK_JWT_ISSUER_DOMAIN to avoid env.ts VITEST dependency in auth config
// Convex deploy validator requires all env vars referenced by auth config to be set
const getIssuerDomain = () => {
  const domain = process.env.CLERK_JWT_ISSUER_DOMAIN
  if (!domain) {
    // Allow missing in test/vitest environment
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
      return 'test.issuer.domain'
    }
    throw new Error('Missing CLERK_JWT_ISSUER_DOMAIN')
  }
  return domain
}

export const authConfig: AuthConfig = {
  providers: [
    {
      domain: getIssuerDomain(),
      applicationID: 'convex',
    },
  ],
}

export default authConfig
