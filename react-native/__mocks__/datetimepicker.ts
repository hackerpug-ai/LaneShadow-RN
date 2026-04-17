/**
 * Mock for @react-native-community/datetimepicker
 *
 * This mock provides a minimal implementation that works with vitest/esbuild.
 * The actual package contains syntax that cannot be parsed by the test runner.
 */

import type { ReactNode } from 'react'

export type DateTimePickerEvent = {
  type: 'set' | 'dismissed'
  nativeEvent?: {
    timestamp?: number
  }
}

export type DateTimePickerProps = {
  value: Date
  mode?: 'date' | 'time' | 'datetime'
  display?: 'default' | 'compact' | 'spinner' | 'clock'
  onChange?: (event: DateTimePickerEvent, selectedDate?: Date) => void
  minimumDate?: Date
  maximumDate?: Date
  minuteInterval?: number
  testID?: string
}

/**
 * Mock DateTimePicker component
 * In tests, this renders nothing but provides the expected interface
 */
export const DateTimePicker = (_props: DateTimePickerProps): ReactNode => {
  // Mock implementation - renders nothing in tests
  return null
}

export default DateTimePicker
