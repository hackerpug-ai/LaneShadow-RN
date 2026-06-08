/**
 * Unit tests for delete-route-dialog.tsx
 *
 * Acceptance Criteria:
 * - AC1: Dialog shown with routeName "Morning Ride" -> shows title "Delete Route", message including "Morning Ride", Cancel and Delete buttons
 * - AC2: User taps "Cancel" -> onDismiss callback fires
 * - AC3: User taps "Delete" -> onConfirm callback fires
 * - AC4: Delete button text uses semantic.color.danger.default color
 */

import { fireEvent, render } from '@testing-library/react-native'
import type React from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { ReactTestInstance } from 'react-test-renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { DeleteRouteDialog } from '../delete-route-dialog'

// ---------------------------------------------------------------------------
// Mock semantic theme
// ---------------------------------------------------------------------------

const mockSemanticTheme = {
  color: {
    primary: { default: '#B87333' },
    secondary: { default: '#1A1C1F' },
    tertiary: { default: '#2B9AEB' },
    success: { default: '#31A362' },
    warning: { default: '#D98E04' },
    danger: { default: '#E35D6A' },
    info: { default: '#2B9AEB' },
    surface: { default: '#2B2725' },
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
    secondaryContainer: { default: '#36302B' },
    onSecondaryContainer: { default: '#E3E3E3', muted: '#D3BBA5', subtle: '#C3AB95' },
    border: { default: '#3A3431' },
    input: { default: '#24272B' },
    ring: { default: '#B87333' },
    card: { default: '#24272B' },
    popover: { default: '#24272B' },
    accent: { default: '#407C5D' },
    orange: { default: '#FF6B35' },
    muted: { default: '#1A1C1F' },
    divider: { default: 'rgba(255,255,255,0.08)' },
    scrim: { default: 'rgba(0,0,0,0.55)' },
    routeSelected: { default: '#B87333' },
    routeAlternate: { default: 'rgba(255,255,255,0.45)' },
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

// Mock useSemanticTheme hook
vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Mock react-native-paper Dialog, Portal, Button, Text
vi.mock('react-native-paper', () => {
  const { View, Text: RNText, Pressable } = require('react-native')
  const { createElement } = require('react')

  const Dialog = ({
    children,
    visible,
    onDismiss,
    testID,
    style,
  }: {
    children: React.ReactNode
    visible: boolean
    onDismiss: () => void
    testID: string
    style: StyleProp<ViewStyle>
  }) => {
    if (!visible) return null
    return createElement(View, { testID, style }, children)
  }

  Dialog.Title = ({
    children,
    style,
  }: {
    children: React.ReactNode
    style: StyleProp<ViewStyle>
  }) => createElement(RNText, { testID: 'dialog-title', style }, children)

  Dialog.Content = ({ children }: { children: React.ReactNode }) =>
    createElement(View, { testID: 'dialog-content' }, children)

  Dialog.Actions = ({ children }: { children: React.ReactNode }) =>
    createElement(View, { testID: 'dialog-actions' }, children)

  const Portal = ({ children }: { children: React.ReactNode }) =>
    createElement(View, null, children)

  const Button = ({
    children,
    onPress,
    testID,
    textColor,
  }: {
    children: React.ReactNode
    onPress: () => void
    testID: string
    textColor: string
  }) =>
    createElement(
      Pressable,
      { onPress, testID, accessibilityRole: 'button' },
      createElement(RNText, { style: { color: textColor } }, children),
    )

  const Text = ({ children, style }: { children: React.ReactNode; style: StyleProp<ViewStyle> }) =>
    createElement(RNText, { style }, children)

  return { Dialog, Portal, Button, Text }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  visible: true,
  routeName: 'Morning Ride',
  onConfirm: vi.fn(),
  onDismiss: vi.fn(),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeleteRouteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC1: Dialog shows title, message with routeName, Cancel and Delete buttons
   */
  describe('AC1: renders title, message, and buttons', () => {
    it('renders the dialog when visible is true', () => {
      const { getByTestId } = render(<DeleteRouteDialog {...defaultProps} />)
      expect(getByTestId('delete-route-dialog')).toBeTruthy()
    })

    it('does not render when visible is false', () => {
      const { queryByTestId } = render(<DeleteRouteDialog {...defaultProps} visible={false} />)
      expect(queryByTestId('delete-route-dialog')).toBeNull()
    })

    it('renders the title "Delete Route"', () => {
      const { getByTestId } = render(<DeleteRouteDialog {...defaultProps} />)
      expect(getByTestId('dialog-title').props.children).toBe('Delete Route')
    })

    it('renders the confirmation message containing the routeName', () => {
      const { getByText } = render(<DeleteRouteDialog {...defaultProps} />)
      expect(getByText(/Are you sure you want to delete/)).toBeTruthy()
      expect(getByText(/Morning Ride/)).toBeTruthy()
    })

    it('renders the undo messaging', () => {
      const { getByText } = render(<DeleteRouteDialog {...defaultProps} />)
      expect(getByText(/You can undo this within 5 seconds/)).toBeTruthy()
    })

    it('renders the Cancel button', () => {
      const { getByTestId } = render(<DeleteRouteDialog {...defaultProps} />)
      expect(getByTestId('delete-route-dialog-cancel')).toBeTruthy()
    })

    it('renders the Delete button', () => {
      const { getByTestId } = render(<DeleteRouteDialog {...defaultProps} />)
      expect(getByTestId('delete-route-dialog-confirm')).toBeTruthy()
    })

    it('uses custom testID prefix when provided', () => {
      const { getByTestId } = render(<DeleteRouteDialog {...defaultProps} testID="custom-dialog" />)
      expect(getByTestId('custom-dialog')).toBeTruthy()
      expect(getByTestId('custom-dialog-cancel')).toBeTruthy()
      expect(getByTestId('custom-dialog-confirm')).toBeTruthy()
    })
  })

  /**
   * AC2: User taps "Cancel" -> onDismiss fires
   */
  describe('AC2: Cancel button fires onDismiss', () => {
    it('calls onDismiss when Cancel is pressed', () => {
      const onDismiss = vi.fn()
      const { getByTestId } = render(<DeleteRouteDialog {...defaultProps} onDismiss={onDismiss} />)
      fireEvent.press(getByTestId('delete-route-dialog-cancel'))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('does not call onConfirm when Cancel is pressed', () => {
      const onConfirm = vi.fn()
      const onDismiss = vi.fn()
      const { getByTestId } = render(
        <DeleteRouteDialog {...defaultProps} onConfirm={onConfirm} onDismiss={onDismiss} />,
      )
      fireEvent.press(getByTestId('delete-route-dialog-cancel'))
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })

  /**
   * AC3: User taps "Delete" -> onConfirm fires
   */
  describe('AC3: Delete button fires onConfirm', () => {
    it('calls onConfirm when Delete is pressed', () => {
      const onConfirm = vi.fn()
      const { getByTestId } = render(<DeleteRouteDialog {...defaultProps} onConfirm={onConfirm} />)
      fireEvent.press(getByTestId('delete-route-dialog-confirm'))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('does not call onDismiss when Delete is pressed', () => {
      const onConfirm = vi.fn()
      const onDismiss = vi.fn()
      const { getByTestId } = render(
        <DeleteRouteDialog {...defaultProps} onConfirm={onConfirm} onDismiss={onDismiss} />,
      )
      fireEvent.press(getByTestId('delete-route-dialog-confirm'))
      expect(onDismiss).not.toHaveBeenCalled()
    })
  })

  /**
   * AC4: Delete button uses semantic.color.danger.default color
   */
  describe('AC4: Delete button uses destructive color token', () => {
    it('Delete button text uses semantic.color.danger.default', () => {
      const { getByTestId } = render(<DeleteRouteDialog {...defaultProps} />)
      const confirmButton = getByTestId('delete-route-dialog-confirm')
      // The Button mock renders a Pressable with a Text child whose style has color
      const textChild = confirmButton.children[0] as ReactTestInstance
      const flatStyle = Array.isArray(textChild.props.style)
        ? Object.assign({}, ...textChild.props.style.flat().filter(Boolean))
        : textChild.props.style
      expect(flatStyle.color).toBe(mockSemanticTheme.color.danger.default)
    })

    it('Cancel button does not use destructive color', () => {
      const { getByTestId } = render(<DeleteRouteDialog {...defaultProps} />)
      const cancelButton = getByTestId('delete-route-dialog-cancel')
      const textChild = cancelButton.children[0] as ReactTestInstance
      const flatStyle = Array.isArray(textChild.props.style)
        ? Object.assign({}, ...textChild.props.style.flat().filter(Boolean))
        : textChild.props.style
      expect(flatStyle.color).not.toBe(mockSemanticTheme.color.danger.default)
    })
  })
})
