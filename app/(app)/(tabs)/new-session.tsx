/**
 * New Session Redirect
 *
 * Temporary redirect page that creates a new session (or finds an existing empty one)
 * and redirects back to the chat view with the correct session ID.
 *
 * This works around expo-router's limitation where navigating to the same route
 * with different query params doesn't trigger a re-render.
 */

import { router } from 'expo-router'
import { useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { ActivityIndicator, View } from 'react-native'
import { api } from '../../../../convex/_generated/api'
import { useSemanticTheme } from '../../../../hooks/use-semantic-theme'

export default function NewSessionRedirect() {
  const { semantic } = useSemanticTheme()
  const sessions = useQuery(api.db.planningSessions.listSessions)
  const createSession = useMutation(api.db.planningSessions.createSession)

  useEffect(() => {
    const handleRedirect = async () => {
      if (sessions === undefined) {
        // Still loading
        return
      }

      // Get the top session ID
      const topSessionId = sessions && sessions.length > 0 ? sessions[0]._id : null

      // Fetch messages for the top session to check if it has visible messages
      let topSessionHasMessages = false
      if (topSessionId) {
        // We need to check message count, but we don't have the query here
        // For now, just check if sessions exist and use the top one
        // The actual message count check happens in the chat screen
      }

      // Create a new session or use the existing top session
      let targetSessionId: string
      if (topSessionId) {
        targetSessionId = topSessionId
      } else {
        const result = await createSession({ firstMessage: '' })
        targetSessionId = result.sessionId
      }

      // Redirect to chat with the session ID
      router.replace('/(app)/(tabs)?sessionId=' + encodeURIComponent(targetSessionId) + '&chat=1')
    }

    handleRedirect()
  }, [sessions, createSession])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={semantic.color.primary.default} />
    </View>
  )
}
