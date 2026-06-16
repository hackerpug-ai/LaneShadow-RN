/**
 * Integration tests for menu-layout.tsx
 *
 * Acceptance Criteria:
 * - AC1: 'Plan a ride' entry is not present in the drawer when menuOpen=true
 * - AC2: Settings and Sessions sections remain present in the drawer when menuOpen=true
 * - AC3: Drawer animations work correctly with proper timing
 * - AC4: Menu navigation triggers correct router.push calls
 * - AC5: Session context menu works on long press
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native'
import type React from 'react'
import { Animated, Pressable, Text as RNText, View } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

// Mock convex/react - must be defined before vi.mock calls
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
}))

// Mock semantic theme
const mockSemanticTheme = {
  color: {
    primary: { default: '#B87333' },
    secondary: { default: '#1A1C1F' },
    tertiary: { default: '#2B9AEB' },
    success: { default: '#31A362' },
    warning: { default: '#D98E04' },
    danger: { default: '#E35D6A' },
    info: { default: '#2B9AEB' },
    surface: { default: '#2B2725', pressed: '#3E3A37' },
    surfaceVariant: { default: '#34302D' },
    background: { default: '#1B1715' },
    onSurface: {
      default: 'rgba(255,255,255,0.92)',
      muted: 'rgba(255,255,255,0.72)',
      subtle: 'rgba(255,255,255,0.55)',
      disabled: '#6B7280',
    },
    onPrimary: { default: '#0E0F11' },
    onSecondary: { default: '#F8F7F6' },
    border: { default: '#3A3431' },
    ring: { default: '#B87333' },
    card: { default: '#24272B' },
    popover: { default: '#24272B' },
    accent: { default: '#407C5D' },
    orange: { default: '#FF6B35' },
    muted: { default: '#1A1C1F' },
    divider: { default: 'rgba(255,255,255,0.08)' },
    scrim: { default: 'rgba(0,0,0,0.55)' },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  radius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999 },
  type: {
    label: {
      sm: { fontSize: 12, lineHeight: 18, fontWeight: '500' as const },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    },
    body: {
      sm: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    },
    title: {
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
      md: { fontSize: 18, lineHeight: 27, fontWeight: '600' as const },
      lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
    },
    display: {
      sm: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const },
      md: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const },
      lg: { fontSize: 57, lineHeight: 64, fontWeight: '400' as const },
    },
  },
  elevation: {
    0: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 5,
    },
  },
}

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Mock expo-router
vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  useSegments: () => ['app', 'tabs', 'index'],
}))

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock react-native-paper
vi.mock('react-native-paper', () => {
  const { View, Text: RNText, Pressable } = require('react-native')
  const { createElement } = require('react')

  const Text = ({ children, style, variant }: any) => 
    createElement(RNText, { style, variant }, children)

  return { Text }
})

// Mock IconSymbol (assuming it's from the project)
vi.mock('../../../components/ui/icon-symbol', () => ({
  IconSymbol: ({ name, size, color }: any) => 
    createElement(View, { 
      testID: `icon-${name}`, 
      style: { width: size, height: size, backgroundColor: color } 
    }),
}))

// Mock SessionContextMenu
vi.mock('../../../components/ui/session-context-menu', () => ({
  SessionContextMenu: ({ visible, onDismiss, position, items, testID }: any) => 
    visible ? 
      createElement(View, { 
        testID: testID || 'session-context-menu', 
        style: { position: 'absolute', left: position.x, top: position.y } 
      }, 
        createElement(View, {}, items.map((item: any, i: number) => 
          createElement(View, { key: i, testID: `context-menu-item-${i}` }, item.label)
        ))
      ) : null,
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { MenuLayout } from './menu-layout'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockSessions = [
  {
    _id: 'session-1',
    title: 'Morning Ride',
    _createdTime: new Date().toISOString(),
  },
  {
    _id: 'session-2',
    title: 'Evening Commute',
    _createdTime: new Date().toISOString(),
  },
]

const mockDeleteSession = vi.fn()

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  children: <View testID="menu-layout-content-area" />,
  menuOpen: true,
  testID: 'menu-layout',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MenuLayout Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mocks
    mockUseQuery.mockReturnValue(mockSessions)
    mockUseMutation.mockReturnValue(mockDeleteSession)
  })

  /**
   * AC1: 'Plan a ride' entry is not present in the drawer
   */
  describe('AC1: drawerHasNoPlanARideEntry', () => {
    it('renders drawer without "Plan a ride" entry', () => {
      const { getByTestId, queryByText, queryByTestId } = render(<MenuLayout {...defaultProps} />)

      // Drawer should be present and open
      expect(getByTestId('menu-layout')).toBeTruthy()
      
      // Check that "Plan a ride" is NOT present
      expect(queryByText('Plan a ride')).toBeNull()
      expect(queryByTestId('drawer-plan-a-ride')).toBeNull()
      
      // Check that "Discover" is NOT present (was likely part of the same section)
      expect(queryByText('Discover')).toBeNull()
    })

    it('does not show "Plan a ride" testIDs in drawer items', () => {
      const { queryByTestId } = render(<MenuLayout {...defaultProps} />)
      
      // Verify no testIDs related to "Plan a ride" exist
      expect(queryByTestId('drawer-plan-a-ride')).toBeNull()
      expect(queryByTestId('drawer-discover')).toBeNull()
      
      // Verify other testIDs work normally
      expect(getByTestId('menu-layout')).toBeTruthy()
    })
  })

  /**
   * AC2: Settings and Sessions sections remain present
   */
  describe('AC2: settingsSavedSessionsRemain', () => {
    it('renders Settings item in drawer', () => {
      const { getByText } = render(<MenuLayout {...defaultProps} />)
      
      // Settings should be present
      expect(getByText('Settings')).toBeTruthy()
    })

    it('renders Saved item in drawer', () => {
      const { getByText } = render(<MenuLayout {...defaultProps} />)
      
      // Saved should be present
      expect(getByText('Saved')).toBeTruthy()
    })

    it('renders Sessions section in drawer', () => {
      const { getByText } = render(<MenuLayout {...defaultProps} />)
      
      // Sessions section title should be present
      expect(getByText('Sessions')).toBeTruthy()
    })

    it('renders session items when sessions exist', () => {
      const { getByText } = render(<MenuLayout {...defaultProps} />)
      
      // Individual session titles should be present
      expect(getByText('Morning Ride')).toBeTruthy()
      expect(getByText('Evening Commute')).toBeTruthy()
    })

    it('renders "No sessions yet" when sessions array is empty', () => {
      vi.mocked(useQuery).mockReturnValue([])
      
      const { getByText } = render(<MenuLayout {...defaultProps} />)
      
      // Empty state should be shown
      expect(getByText('No sessions yet')).toBeTruthy()
    })

    it('renders Sessions section even when no external sections provided', () => {
      const { getByText } = render(
        <MenuLayout 
          {...defaultProps} 
          sections={[]} // No external sections
        />
      )
      
      // Should still show Sessions section from internal state
      expect(getByText('Sessions')).toBeTruthy()
    })
  })

  /**
   * Additional integration tests for complete coverage
   */
  describe('AC3: drawerAnimationAndBehavior', () => {
    it('calls onMenuOpenChange when menu items are pressed', () => {
      const onMenuOpenChange = vi.fn()
      const { getByText } = render(
        <MenuLayout 
          {...defaultProps} 
          onMenuOpenChange={onMenuOpenChange}
        />
      )

      // Press Settings item
      fireEvent.press(getByText('Settings'))
      
      // Should call close callback
      expect(onMenuOpenChange).toHaveBeenCalledWith(false)
    })

    it('calls router.push when Settings is pressed', () => {
      const { useRouter } = require('expo-router')
      const mockRouter = useRouter()
      
      const { getByText } = render(<MenuLayout {...defaultProps} />)
      
      // Press Settings item
      fireEvent.press(getByText('Settings'))
      
      // Should navigate to settings
      expect(mockRouter.push).toHaveBeenCalledWith('/(app)/(tabs)/settings')
    })

    it('calls router.push when Saved is pressed', () => {
      const { useRouter } = require('expo-router')
      const mockRouter = useRouter()
      
      const { getByText } = render(<MenuLayout {...defaultProps} />)
      
      // Press Saved item
      fireEvent.press(getByText('Saved'))
      
      // Should navigate to saved routes
      expect(mockRouter.push).toHaveBeenCalledWith('/(app)/(tabs)/saved-routes')
    })
  })

  /**
   * AC4: Session context menu functionality
   */
  describe('AC4: sessionContextMenu', () => {
    it('shows context menu on long press of session item', () => {
      const { getByText, getByTestId } = render(<MenuLayout {...defaultProps} />)
      
      // Long press on session item
      fireEvent(getByText('Morning Ride'), 'longPress')
      
      // Context menu should appear
      expect(getByTestId('session-context-menu')).toBeTruthy()
    })

    it('calls delete session when context menu delete is pressed', () => {
      mockDeleteSession.mockResolvedValue(undefined)
      
      const { getByText, getByTestId, getByRole } = render(<MenuLayout {...defaultProps} />)
      
      // Long press on session item to show context menu
      fireEvent(getByText('Morning Ride'), 'longPress')
      
      // Press delete button in context menu
      const deleteButton = getByRole('button', { name: 'Delete' })
      fireEvent.press(deleteButton)
      
      // Should call delete with correct session ID
      expect(mockDeleteSession).toHaveBeenCalledWith({ sessionId: 'session-1' })
    })

    it('dismisses context menu when dismissed', () => {
      const { getByText, getByTestId, queryByTestId } = render(<MenuLayout {...defaultProps} />)
      
      // Long press on session item to show context menu
      fireEvent(getByText('Morning Ride'), 'longPress')
      
      // Context menu should be visible
      expect(getByTestId('session-context-menu')).toBeTruthy()
      
      // Dismiss context menu
      fireEvent.press(getByTestId('session-context-menu'))
      
      // Context menu should be hidden
      expect(queryByTestId('session-context-menu')).toBeNull()
    })
  })

  /**
   * AC5: Theme integration
   */
  describe('AC5: themeIntegration', () => {
    it('uses semantic theme tokens for styling', () => {
      const { getByTestId } = render(<MenuLayout {...defaultProps} />)
      
      const drawer = getByTestId('menu-layout')
      
      // Check that background color uses theme token
      expect(drawer.props.style.backgroundColor).toBe(mockSemanticTheme.color.background.default)
      
      // Check that padding uses theme token
      expect(drawer.props.style.paddingTop).toBe(0) // From safe area mock
    })
  })
})