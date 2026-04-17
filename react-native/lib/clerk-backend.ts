import { createClerkClient } from '@clerk/backend'
import { CLERK_SECRET_KEY } from '../convex/lib/env'

export const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY })
