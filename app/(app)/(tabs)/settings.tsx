import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useAuth } from '@clerk/clerk-expo'
import { MenuLayout } from '../../../components/layouts/menu-layout'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { Button } from '../../../components/ui/button'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { ThemePicker } from '../../../components/settings/theme-picker'

const SettingsScreen = () => {
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const { signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoggingOut(true)
            await signOut()
            router.replace('/(auth)/sign-in' as any)
          } catch (error) {
            console.error('Logout failed:', error)
            Alert.alert('Error', 'Failed to sign out. Please try again.')
            setIsLoggingOut(false)
          }
        },
      },
    ])
  }

  return (
    <MenuLayout menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} testID="settings-menu-layout">
      <SubpageLayout title="Settings" testID="settings-screen">
        <View
          style={[
            styles.container,
            {
              backgroundColor: semantic.color.background.default,
              padding: semantic.space.lg,
            },
          ]}
        >
          <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
            Placeholder screen for app settings.
          </Text>

          {/* Theme Picker */}
          <ThemePicker testID="settings-theme-picker" />

          {/* Logout Button */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: semantic.color.border.default,
                paddingTop: semantic.space.lg,
              },
            ]}
          >
            <Button
              variant="destructive"
              size="lg"
              onPress={handleLogout}
              disabled={isLoggingOut}
              loading={isLoggingOut}
              testID="settings-logout-button"
              style={{ width: '100%' }}
            >
              Sign Out
            </Button>
          </View>
        </View>
      </SubpageLayout>
    </MenuLayout>
  )
}

export default SettingsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  footer: {
    borderTopWidth: 1,
    marginTop: 'auto',
  },
})
