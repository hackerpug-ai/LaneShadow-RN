import { useAuth, useClerk } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, View } from 'react-native'
import { Text } from 'react-native-paper'
import { Button } from '../../components/ui/button'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export const ClerkTasksScreen = () => {
  const { semantic } = useSemanticTheme()
  const router = useRouter()
  const clerk = useClerk()
  const { signOut } = useAuth()

  const currentTask = clerk.session?.currentTask

  const taskLabel = useMemo(() => {
    if (!currentTask) return 'No pending task'
    const key = (currentTask as any).key ?? 'unknown'
    return `Pending task: ${String(key)}`
  }, [currentTask])

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: semantic.space.xl,
        gap: semantic.space.lg,
        justifyContent: 'center',
      }}
    >
      <View style={{ gap: semantic.space.sm }}>
        <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
          Finish signing in
        </Text>
        <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
          {taskLabel}
        </Text>
      </View>

      {__DEV__ ? (
        <View style={{ gap: semantic.space.sm }}>
          <Text variant="labelMedium" style={{ color: semantic.color.onSurface.muted }}>
            Debug: full task payload
          </Text>
          <Text
            variant="bodySmall"
            style={{
              color: semantic.color.onSurface.default,
              backgroundColor: semantic.color.surfaceVariant.default,
              padding: semantic.space.md,
              borderRadius: semantic.radius.lg,
            }}
          >
            {JSON.stringify(currentTask ?? null, null, 2)}
          </Text>
        </View>
      ) : null}

      <Button
        variant="default"
        size="2xl"
        onPress={() => {
          router.replace('/(app)' as any)
        }}
      >
        Try continue
      </Button>

      <Button
        variant="glass"
        size="xl"
        onPress={async () => {
          await signOut()
          router.replace('/(auth)/sign-in' as any)
        }}
      >
        Sign out and try again
      </Button>
    </ScrollView>
  )
}

export default ClerkTasksScreen
