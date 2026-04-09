import { Redirect } from 'expo-router'
import { useQuery } from 'convex/react'
import { useAuth } from '@clerk/clerk-expo'
import { useEffect, useRef, useState } from 'react'
import { api } from '../convex/_generated/api'

const Index = () => {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth()

  // Fetch sessions for auto-navigation logic
  // Only query when Clerk auth is loaded and user is signed in to prevent race conditions.
  const sessions = useQuery(
    api.db.planningSessions.listSessions,
    clerkLoaded && isSignedIn ? undefined : 'skip'
  )

  // Track redirect target
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null)

  const isLoading = sessions === undefined

  // Auto-navigation logic (similar to Holocron):
  // - On first mount, navigate to tabs immediately (optimistic empty state)
  // - After sessions load, if sessions exist, redirect to most recent
  useEffect(() => {
    // Skip if still loading or already set redirect
    if (isLoading || redirectTarget !== null) {
      return
    }

    // If sessions exist, navigate to the most recent one
    // Otherwise, navigate to tabs without sessionId (empty state)
    if (sessions && sessions.length > 0) {
      const mostRecent = sessions[0]
      console.info('[Index] Redirecting to most recent session', {
        sessionId: mostRecent._id,
      })
      setRedirectTarget(`/(app)/(tabs)?sessionId=${mostRecent._id}`)
    } else {
      console.info('[Index] No sessions found, navigating to tabs without session')
      setRedirectTarget('/(app)/(tabs)')
    }
  }, [isLoading, sessions, redirectTarget])

  // While determining redirect, show nothing
  if (redirectTarget === null) {
    return null
  }

  return <Redirect href={redirectTarget as any} />
}

export default Index
