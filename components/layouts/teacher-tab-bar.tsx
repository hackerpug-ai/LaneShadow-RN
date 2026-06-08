/**
 * Teacher Tab Bar Component
 *
 * Bottom navigation with Feed and Reports tabs, plus center camera button
 * Following theme_rules.mdc - StyleSheet for static, inline for theme
 */

// Camera helpers are no longer used directly here; assistant overlay handles camera via sheet
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { type IconName, IconSymbol } from '../ui/icon-symbol'

export type TeacherTabBarProps = {
  currentRoute: string
  testID?: string
  action: {
    icon: IconName
    label: string
    onPress?: () => void // Legacy
    onPressIn?: () => void // Sprint 06: Push-to-talk start
    onPressOut?: () => void // Sprint 06: Push-to-talk end
    disabled?: boolean
    isActive?: boolean // Sprint 06: Visual feedback while recording
  }
}

export const TeacherTabBar = ({ currentRoute, testID, action }: TeacherTabBarProps) => {
  const { semantic } = useSemanticTheme()
  const router = useRouter()

  const tabs = [
    { key: 'index', label: 'Feed', icon: 'newspaper' as IconName },
    { key: 'reports', label: 'Reports', icon: 'chart-bar' as IconName },
  ] as const
  const [feedTab, reportsTab] = tabs

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: semantic.color.background.default,
          borderTopColor: semantic.color.border.default,
          paddingHorizontal: semantic.space.lg,
        },
      ]}
    >
      {/* Left Tab - Feed */}
      <TabButton
        tab={feedTab}
        isActive={currentRoute === feedTab.key}
        onPress={() => router.push('/(teacher)' as any)}
        semantic={semantic}
      />

      {/* Center Microphone Button */}
      <View style={styles.centerButtonContainer}>
        <Pressable
          onPress={action.onPress}
          onPressIn={action.onPressIn}
          onPressOut={action.onPressOut}
          disabled={action.disabled}
          testID={testID ? `${testID}-${action.label}-button` : `${action.label}-button`}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: action.disabled
                ? semantic.color.primary.disabled
                : action.isActive || pressed
                  ? semantic.color.primary.pressed
                  : semantic.color.primary.default,
              borderRadius: semantic.radius.full,
              shadowColor: semantic.color.primary.default,
              transform: [{ scale: (action.isActive || pressed) && !action.disabled ? 1.1 : 1 }],
              opacity: action.disabled ? 0.5 : 1,
            },
          ]}
        >
          <IconSymbol
            name={action.icon}
            size={action.isActive ? 36 : 32}
            color={
              action.disabled
                ? semantic.color.onPrimary.disabled || semantic.color.onPrimary.default
                : semantic.color.onPrimary.default
            }
          />
        </Pressable>
      </View>

      {/* Right Tab - Reports */}
      <TabButton
        tab={reportsTab}
        isActive={currentRoute === reportsTab.key}
        onPress={() => router.push('/(teacher)/reports' as any)}
        semantic={semantic}
      />
    </View>
  )
}

// Tab Button Component (extracted from _layout.tsx)
function TabButton({
  tab,
  isActive,
  onPress,
  semantic,
}: {
  tab: { key: string; label: string; icon: IconName }
  isActive: boolean
  onPress: () => void
  semantic: any
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={`tab-${tab.key}`}
      style={[styles.tabItem, { gap: semantic.space.xs }]}
    >
      {isActive && (
        <View
          style={[
            styles.activeIndicator,
            {
              backgroundColor: `${semantic.color.primary.default}33`,
              borderRadius: semantic.radius.full,
              paddingHorizontal: semantic.space.sm,
              paddingVertical: semantic.space.sm,
            },
          ]}
        >
          <IconSymbol name={tab.icon} size={24} color={semantic.color.primary.default} />
        </View>
      )}
      {!isActive && <IconSymbol name={tab.icon} size={24} color={semantic.color.onSurface.muted} />}
      <Text
        variant={isActive ? 'labelMedium' : 'bodySmall'}
        style={{
          color: isActive ? semantic.color.primary.default : semantic.color.onSurface.muted,
        }}
      >
        {tab.label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
    borderTopWidth: 1,
  },
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  actionButton: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
})
