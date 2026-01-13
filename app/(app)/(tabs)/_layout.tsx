import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'

const TabsLayout = () => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const activeColor = semantic.color.primary.default
  const inactiveColor = semantic.color.onSurface.muted

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarIconStyle: { marginBottom: -4 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: semantic.color.surface.default,
          borderTopColor: semantic.color.border.default,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: Math.max(16, insets.bottom + 8),
          height: 85,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="home-variant"
              size={22}
              color={focused ? activeColor : inactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="cog"
              size={22}
              color={focused ? activeColor : inactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved-routes"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="bookmark-multiple"
              size={22}
              color={focused ? activeColor : inactiveColor}
            />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabsLayout
