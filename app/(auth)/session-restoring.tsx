import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useSession } from '../../providers/session-provider'

export const SessionRestoringScreen = () => {
  const router = useRouter()
  const { isLoading, sessionId, session } = useSession()
  const { semantic } = useSemanticTheme()

  useEffect(() => {
    if (isLoading) return
    if (sessionId && session) {
      router.replace('/(app)')
    } else {
      router.replace('/(auth)/sign-in')
    }
  }, [isLoading, router, session, sessionId])

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: semantic.color.background.default,
      }}
    >
      <ActivityIndicator color={semantic.color.primary.default} />
    </View>
  )
}

export default SessionRestoringScreen
