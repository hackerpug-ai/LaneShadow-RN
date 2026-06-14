import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Platform, View } from 'react-native'
import { Text } from 'react-native-paper'

export const OAuthCallbackScreen = () => {
  const router = useRouter()

  useEffect(() => {
    // On web, Clerk redirects back to this route. Give Clerk a moment, then continue.
    if (Platform.OS === 'web') {
      const timer = setTimeout(() => {
        router.replace('/(app)/(tabs)/discover' as any)
      }, 1000)
      return () => clearTimeout(timer)
    }

    // On native, OAuth callbacks should be handled by deep links, not by this route.
    router.replace('/(auth)/sign-in' as any)
  }, [router])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text variant="titleMedium">Logging you in…</Text>
    </View>
  )
}

export default OAuthCallbackScreen
