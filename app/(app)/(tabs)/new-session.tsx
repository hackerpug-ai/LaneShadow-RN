/**
 * New Session Loading Screen
 *
 * Creates a new planning session and redirects to the chat screen with the new session ID.
 * Shows a loading state while the session is being created.
 *
 * This route is used instead of creating sessions directly in the chat screen to avoid
 * race conditions with navigation timing.
 */

import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'

export default function NewSessionScreen() {
  const { semantic } = useSemanticTheme()
  const router = useRouter()
  const createSession = useMutation(api.db.planningSessions.createSession)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const createNewSession = async () => {
      try {
        console.info('[NewSessionScreen] Creating new session')
        const result = await createSession({ firstMessage: '' })

        if (result?.sessionId) {
          console.info('[NewSessionScreen] Session created, redirecting to chat', {
            sessionId: result.sessionId,
          })
          // Redirect to chat screen with the new session ID
          router.replace(`/chat?sessionId=${result.sessionId}` as any)
        } else {
          throw new Error('Failed to create session - no ID returned')
        }
      } catch (err) {
        console.error('[NewSessionScreen] Failed to create session', err)
        setError('Failed to create new session. Please try again.')
        // Auto-retry after 2 seconds
        setTimeout(() => {
          router.back()
        }, 2000)
      }
    }

    createNewSession()
  }, [createSession, router])

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.content}>
          <Text style={[styles.message, { color: '#dc2626' }]}>
            {error}
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <ActivityIndicator size="large" color={semantic.color.primary.default} />
          <Text style={[styles.message, { color: semantic.color.onSurface.muted }]}>
            Creating new session…
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
})
