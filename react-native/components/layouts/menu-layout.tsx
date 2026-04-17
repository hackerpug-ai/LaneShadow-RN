import { useMutation, useQuery } from 'convex/react'
import { useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { DrawerMenuItem, DrawerMenuSection } from '../ui/menus/drawer-menu'
import { DrawerMenu } from '../ui/menus/drawer-menu'
import { SessionContextMenu } from '../ui/session-context-menu'

const DRAWER_WIDTH = 280

export type MenuLayoutProps = {
  children: React.ReactNode | ((onMenuPress: () => void) => React.ReactNode)
  headerTitle?: string
  alignment?: 'left' | 'right'
  testID?: string
  menuOpen?: boolean
  onMenuOpenChange?: (open: boolean) => void
  sections?: DrawerMenuSection[]
  footerItems?: DrawerMenuItem[]
}

export const MenuLayout = ({
  children,
  headerTitle = 'Menu',
  alignment = 'left',
  testID,
  menuOpen = false,
  onMenuOpenChange,
  sections: externalSections,
  footerItems: externalFooterItems,
}: MenuLayoutProps) => {
  const router = useRouter()
  const segments = useSegments() as string[]
  const activeTab = segments[2] ?? 'index'

  const sessions = useQuery(api.db.planningSessions.listSessions)
  const deleteSession = useMutation(api.db.planningSessions.deleteSession)

  // Context menu state for session deletion
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [contextMenuSessionId, setContextMenuSessionId] = useState<Id<'planning_sessions'> | null>(
    null,
  )

  const [contentOffset] = useState(new Animated.Value(0))

  // Track long press position for context menu
  const [longPressPosition, setLongPressPosition] = useState<{ x: number; y: number } | null>(null)

  const handleDeleteSession = async () => {
    if (contextMenuSessionId) {
      await deleteSession({ sessionId: contextMenuSessionId })
      setContextMenuVisible(false)
      setContextMenuSessionId(null)
    }
  }

  const sessionsSection: DrawerMenuSection = {
    title: 'Sessions',
    items:
      !sessions || sessions.length === 0
        ? [
            {
              label: 'No sessions yet',
              icon: 'motorbike' as const,
              onPress: () => {},
              disabled: true,
              testID: 'drawer-sessions-empty',
            },
          ]
        : sessions.slice(0, 20).map((s: (typeof sessions)[0]) => ({
            label: s.title || 'Untitled ride',
            icon: 'motorbike' as const,
            onPress: () => {
              onMenuOpenChange?.(false)
              router.push({
                pathname: '/(app)/(tabs)',
                params: { sessionId: s._id, chat: '1' },
              })
            },
            onLongPress: () => {
              setContextMenuSessionId(s._id)
              setContextMenuVisible(true)
              setLongPressPosition({ x: 140, y: 200 }) // Default position
            },
            testID: `drawer-session-${s._id}`,
          })),
  }

  const internalMenuSections: DrawerMenuSection[] = [
    {
      title: 'Navigate',
      items: [
        {
          label: 'Home',
          icon: 'home-variant',
          active: activeTab === 'index',
          onPress: () => router.push('/(app)/(tabs)'),
        },
        {
          label: 'Settings',
          icon: 'cog',
          active: activeTab === 'settings',
          onPress: () => router.push('/(app)/(tabs)/settings'),
        },
        {
          label: 'Saved',
          icon: 'bookmark-multiple',
          active: activeTab === 'saved-routes',
          onPress: () => router.push('/(app)/(tabs)/saved-routes'),
        },
      ],
    },
    sessionsSection,
  ]

  const internalFooterItems: DrawerMenuItem[] = []

  const menuSections = externalSections || internalMenuSections
  const footerItems = externalFooterItems || internalFooterItems
  useEffect(() => {
    const offset = menuOpen ? DRAWER_WIDTH : 0
    const finalValue = alignment === 'left' ? offset : -offset
    Animated.timing(contentOffset, {
      toValue: finalValue,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [menuOpen, contentOffset, alignment])

  const wrappedFooterItems: DrawerMenuItem[] = footerItems.map((item) => ({
    ...item,
    onPress: () => {
      onMenuOpenChange?.(false)
      item.onPress()
    },
  }))

  const wrappedSections: DrawerMenuSection[] = menuSections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      onPress: () => {
        onMenuOpenChange?.(false)
        item.onPress()
      },
    })),
  }))

  return (
    <View style={styles.container}>
      <DrawerMenu
        isOpen={menuOpen}
        onClose={() => onMenuOpenChange?.(false)}
        header={{ title: headerTitle, testID: `${testID}-drawer-header` }}
        sections={wrappedSections}
        footer={{ items: wrappedFooterItems }}
        alignment={alignment}
        testID={testID}
      />

      <Animated.View
        style={[
          styles.contentArea,
          {
            transform: [{ translateX: contentOffset }],
          },
        ]}
      >
        {typeof children === 'function' ? children(() => onMenuOpenChange?.(false)) : children}
      </Animated.View>

      {/* Context menu for session actions */}
      {longPressPosition && (
        <SessionContextMenu
          visible={contextMenuVisible}
          onDismiss={() => {
            setContextMenuVisible(false)
            setContextMenuSessionId(null)
            setLongPressPosition(null)
          }}
          position={longPressPosition}
          items={[
            {
              label: 'Delete',
              icon: 'trash-can-outline',
              destructive: true,
              onPress: handleDeleteSession,
              testID: 'session-context-menu-delete',
            },
          ]}
          testID="session-context-menu"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
})
