import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'

const TabsLayout = () => {
  const { semantic } = useSemanticTheme()
  const _insets = useSafeAreaInsets()
  const activeColor: string = semantic.color.primary.default ?? ''
  const inactiveColor: string = semantic.color.onSurface.muted ?? ''

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
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="compass"
              size={22}
              color={focused ? activeColor : inactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plan a ride',
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="motorbike"
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
            <IconSymbol name="cog" size={22} color={focused ? activeColor : inactiveColor} />
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
