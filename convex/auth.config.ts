import type { AuthConfig } from 'convex/server'
import { CLERK_JWT_ISSUER_DOMAIN } from './lib/env'

export const authConfig: AuthConfig = {
  providers: [
    {
      domain: CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
}

export default authConfig
