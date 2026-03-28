import { useRouter, useSegments } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { MenuLayout } from '../../../components/layouts/menu-layout'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { FavoriteRoadsSection } from '../../../components/settings/favorite-roads-section'

const SettingsScreen = () => {
  const router = useRouter()
  const segments = useSegments()
  const activeTab = segments[2] ?? 'index'
  const { semantic } = useSemanticTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <MenuLayout menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} testID="settings-menu-layout">
      <View
        style={[
          styles.container,
          {
            backgroundColor: semantic.color.background.default,
            padding: semantic.space.lg,
          },
        ]}
      >
        <Text variant="headlineSmall" style={{ color: semantic.color.onSurface.default }}>
          Settings
        </Text>
        <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
          Placeholder screen for app settings.
        </Text>

        {/* Favorite Roads Section */}
        <FavoriteRoadsSection />
      </View>
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
