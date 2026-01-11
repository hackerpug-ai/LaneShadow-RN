import type { AuthConfig } from 'convex/server'

export const authConfig: AuthConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: 'convex',
    },
  ],
}

export default authConfig
