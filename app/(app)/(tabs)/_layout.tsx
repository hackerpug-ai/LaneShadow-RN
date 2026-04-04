import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconSymbol } from '../../../components/ui/icon-symbol'
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
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <IconSymbol
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
            <IconSymbol
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
            <IconSymbol
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
