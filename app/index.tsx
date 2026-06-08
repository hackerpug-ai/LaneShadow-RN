import { useAuth } from '@clerk/clerk-expo'
import { useQuery } from 'convex/react'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { api } from '../server/convex/_generated/api'

const Index = () => {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth()

  // Fetch sessions for auto-navigation logic
  // Only query when Clerk auth is loaded and user is signed in to prevent race conditions.
  const sessions = useQuery(
    api.db.planningSessions.listSessions,
    clerkLoaded && isSignedIn ? undefined : 'skip',
  )

  // Track redirect target
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null)

  const isLoading = sessions === undefined

  // Auto-navigation logic:
  // - If Clerk is loaded but user is not signed in, go to auth (tabs will handle this)
  // - If Clerk is loaded and user is signed in, wait for sessions then redirect
  useEffect(() => {
    // Skip if already set redirect
    if (redirectTarget !== null) {
      return
    }

    // If Clerk not loaded yet, wait
    if (!clerkLoaded) {
      return
    }

    // If user is not signed in, go to tabs (auth screen will show)
    if (!isSignedIn) {
      setRedirectTarget('/(app)/(tabs)')
      return
    }

    // If sessions are still loading, wait
    if (isLoading) {
      return
    }

    // If sessions exist, navigate to the most recent one
    // Otherwise, navigate to tabs without sessionId (empty state)
    if (sessions && sessions.length > 0) {
      const mostRecent = sessions[0]
      setRedirectTarget(`/(app)/(tabs)?sessionId=${mostRecent._id}`)
    } else {
      setRedirectTarget('/(app)/(tabs)')
    }
  }, [clerkLoaded, isSignedIn, isLoading, sessions, redirectTarget])

  // While determining redirect, show nothing
  if (redirectTarget === null) {
    return null
  }

  return <Redirect href={redirectTarget as any} />
}

export default Index
