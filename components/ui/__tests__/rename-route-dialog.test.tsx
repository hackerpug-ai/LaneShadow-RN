/**
 * Unit tests for rename-route-dialog.tsx
 *
 * Acceptance Criteria:
 * - AC1: Dialog opens with currentName "Morning Ride" → TextInput shows "Morning Ride", Save disabled
 * - AC2: User changes text to "Evening Ride" → Save button enabled
 * - AC3: User taps Save → onRename("Evening Ride") fires
 * - AC4: User clears all text → Save button disabled
 * - AC5: User taps Cancel → onDismiss fires, onRename not called
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import type { ExtendedTheme } from '../../../styles/types'

// ---------------------------------------------------------------------------
// Mock semantic theme
// ---------------------------------------------------------------------------

const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#6750A4' },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
    surface: { default: '#141218' },
    surfaceVariant: { default: '#2B2930' },
    background: { default: '#141218' },
    onSurface: {
      default: '#E6E0E9',
      muted: '#938F99',
      subtle: '#79747E',
      disabled: '#4A4458',
    },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#FFFFFF' },
    secondaryContainer: { default: '#4A4458' },
    onSecondaryContainer: { default: '#E8DEF8', muted: '#938F99', subtle: '#79747E' },
    border: { default: '#49454F' },
    input: { default: '#49454F' },
    ring: { default: '#6750A4' },
    card: { default: '#1C1B1F' },
    popover: { default: '#1C1B1F' },
    accent: { default: '#FF6B35' },
    orange: { default: '#fb923c' },
    muted: { default: '#938F99' },
    divider: { default: '#49454F' },
    scrim: { default: '#000000' },
    routeSelected: { default: '#FF6B35' },
    routeAlternate: { default: '#60a5fa' },
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  type: {
    label: {
      sm: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
      md: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    },
    body: {
      sm: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    },
    title: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
      md: { fontSize: 18, lineHeight: 28, fontWeight: '500' as const },
      lg: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const },
    },
    heading: {
      sm: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
      md: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
      lg: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const },
    },
    display: {
      sm: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
      md: { fontSize: 40, lineHeight: 48, fontWeight: '700' as const },
      lg: { fontSize: 48, lineHeight: 56, fontWeight: '700' as const },
    },
  },
  elevation: {
    0: { shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
    3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 },
    5: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 5 },
  },
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Mock react-native-paper Dialog, Portal, TextInput, Button
jest.mock('react-native-paper', () => {
  const { View, Text, TextInput: RNTextInput, Pressable } = require('react-native')
  const { createElement } = require('react')

  const Portal = (props) =>
    createElement(View, { testID: 'portal' }, props.children)

  const Dialog = (props) => {
    if (!props.visible) return null
    return createElement(View, { testID: props.testID, style: props.style, accessibilityRole: 'none' }, props.children)
  }

  Dialog.Title = (props) => createElement(Text, { style: props.style }, props.children)

  Dialog.Content = (props) => createElement(View, null, props.children)

  Dialog.Actions = (props) => createElement(View, null, props.children)

  const Button = (props) =>
    createElement(
      Pressable,
      { onPress: props.disabled ? undefined : props.onPress, testID: props.testID, disabled: props.disabled, accessibilityRole: 'button' },
      createElement(Text, { style: { color: props.textColor } }, props.children)
    )

  const TextInput = (props) =>
    createElement(RNTextInput, {
      value: props.value,
      onChangeText: props.onChangeText,
      maxLength: props.maxLength,
      autoFocus: props.autoFocus,
      testID: props.testID,
      style: { color: props.textColor },
    })

  return {
    Portal,
    Dialog,
    Button,
    TextInput,
  }
})

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { RenameRouteDialog } from '../rename-route-dialog'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  visible: true,
  currentName: 'Morning Ride',
  onRename: jest.fn(),
  onDismiss: jest.fn(),
}

const renderDialog = (props?: Partial<typeof defaultProps>) =>
  render(<RenameRouteDialog {...defaultProps} {...props} />)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RenameRouteDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * AC1: Dialog opens with currentName "Morning Ride"
   * → TextInput shows "Morning Ride", Save button disabled (name unchanged)
   */
  describe('AC1: pre-populated input, Save disabled when name unchanged', () => {
    it('renders the dialog when visible=true', () => {
      const { getByTestId } = renderDialog()
      expect(getByTestId('rename-route-dialog')).toBeTruthy()
    })

    it('TextInput shows the currentName value', () => {
      const { getByTestId } = renderDialog()
      const input = getByTestId('rename-route-dialog-input')
      expect(input.props.value).toBe('Morning Ride')
    })

    it('Save button is disabled when input equals currentName', () => {
      const { getByTestId } = renderDialog()
      const saveBtn = getByTestId('rename-route-dialog-save')
      expect(saveBtn.props.disabled).toBe(true)
    })

    it('does not render the dialog when visible=false', () => {
      const { queryByTestId } = renderDialog({ visible: false })
      expect(queryByTestId('rename-route-dialog')).toBeNull()
    })

    it('renders with custom testID', () => {
      const { getByTestId } = render(
        <RenameRouteDialog
          visible
          currentName="Morning Ride"
          onRename={jest.fn()}
          onDismiss={jest.fn()}
          testID="custom-dialog"
        />
      )
      expect(getByTestId('custom-dialog')).toBeTruthy()
      expect(getByTestId('custom-dialog-input')).toBeTruthy()
      expect(getByTestId('custom-dialog-cancel')).toBeTruthy()
      expect(getByTestId('custom-dialog-save')).toBeTruthy()
    })
  })

  /**
   * AC2: User changes text to "Evening Ride" → Save button becomes enabled
   */
  describe('AC2: Save enabled when name changes', () => {
    it('Save button becomes enabled after text change', () => {
      const { getByTestId } = renderDialog()
      const input = getByTestId('rename-route-dialog-input')
      fireEvent.changeText(input, 'Evening Ride')
      const saveBtn = getByTestId('rename-route-dialog-save')
      expect(saveBtn.props.disabled).toBe(false)
    })

    it('Save remains disabled when user types only whitespace', () => {
      const { getByTestId } = renderDialog()
      const input = getByTestId('rename-route-dialog-input')
      fireEvent.changeText(input, '   ')
      const saveBtn = getByTestId('rename-route-dialog-save')
      expect(saveBtn.props.disabled).toBe(true)
    })

    it('Save remains disabled when trimmed input equals currentName', () => {
      const { getByTestId } = renderDialog()
      const input = getByTestId('rename-route-dialog-input')
      // Same name with surrounding whitespace
      fireEvent.changeText(input, '  Morning Ride  ')
      const saveBtn = getByTestId('rename-route-dialog-save')
      expect(saveBtn.props.disabled).toBe(true)
    })
  })

  /**
   * AC3: User has changed name to "Evening Ride", taps Save → onRename fires
   */
  describe('AC3: Save button fires onRename with trimmed value', () => {
    it('calls onRename with the new trimmed name when Save is pressed', () => {
      const onRename = jest.fn()
      const { getByTestId } = renderDialog({ onRename })
      const input = getByTestId('rename-route-dialog-input')
      fireEvent.changeText(input, 'Evening Ride')
      fireEvent.press(getByTestId('rename-route-dialog-save'))
      expect(onRename).toHaveBeenCalledTimes(1)
      expect(onRename).toHaveBeenCalledWith('Evening Ride')
    })

    it('trims whitespace before calling onRename', () => {
      const onRename = jest.fn()
      const { getByTestId } = renderDialog({ onRename })
      const input = getByTestId('rename-route-dialog-input')
      fireEvent.changeText(input, '  Evening Ride  ')
      fireEvent.press(getByTestId('rename-route-dialog-save'))
      expect(onRename).toHaveBeenCalledWith('Evening Ride')
    })
  })

  /**
   * AC4: User clears all text → Save button is disabled
   */
  describe('AC4: Save disabled when input is empty', () => {
    it('Save button is disabled when input is cleared', () => {
      const { getByTestId } = renderDialog()
      const input = getByTestId('rename-route-dialog-input')
      fireEvent.changeText(input, '')
      const saveBtn = getByTestId('rename-route-dialog-save')
      expect(saveBtn.props.disabled).toBe(true)
    })

    it('onRename is not called when Save is pressed while disabled', () => {
      const onRename = jest.fn()
      const { getByTestId } = renderDialog({ onRename })
      const input = getByTestId('rename-route-dialog-input')
      fireEvent.changeText(input, '')
      // Save is disabled, pressing it should not call onRename
      fireEvent.press(getByTestId('rename-route-dialog-save'))
      expect(onRename).not.toHaveBeenCalled()
    })
  })

  /**
   * AC5: User taps Cancel → onDismiss fires, onRename not called
   */
  describe('AC5: Cancel fires onDismiss without calling onRename', () => {
    it('calls onDismiss when Cancel is pressed', () => {
      const onDismiss = jest.fn()
      const { getByTestId } = renderDialog({ onDismiss })
      fireEvent.press(getByTestId('rename-route-dialog-cancel'))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('does not call onRename when Cancel is pressed', () => {
      const onRename = jest.fn()
      const onDismiss = jest.fn()
      const { getByTestId } = renderDialog({ onRename, onDismiss })
      fireEvent.press(getByTestId('rename-route-dialog-cancel'))
      expect(onRename).not.toHaveBeenCalled()
    })
  })

  /**
   * State reset: When currentName prop changes, internal state resets
   */
  describe('state reset when currentName prop changes', () => {
    it('resets internal name when currentName prop changes', () => {
      const { getByTestId, rerender } = renderDialog({ currentName: 'Morning Ride' })
      const input = getByTestId('rename-route-dialog-input')
      expect(input.props.value).toBe('Morning Ride')

      rerender(
        <RenameRouteDialog
          visible
          currentName="Afternoon Ride"
          onRename={jest.fn()}
          onDismiss={jest.fn()}
        />
      )
      const updatedInput = getByTestId('rename-route-dialog-input')
      expect(updatedInput.props.value).toBe('Afternoon Ride')
    })
  })
})
