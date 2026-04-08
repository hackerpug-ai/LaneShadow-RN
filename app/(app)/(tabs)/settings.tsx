import { useRouter, useSegments } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { MenuLayout } from '../../../components/layouts/menu-layout'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { ThemePicker } from '../../../components/settings/theme-picker'

const SettingsScreen = () => {
  const router = useRouter()
  const segments = useSegments() as string[]
  const activeTab = segments[2] ?? 'index'
  const { semantic } = useSemanticTheme()
  const [menuOpen, setMenuOpen] = useState(false)

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
})
