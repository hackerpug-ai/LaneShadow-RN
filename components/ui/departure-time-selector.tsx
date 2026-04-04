/**
 * DepartureTimeSelector Component
 *
 * Date/time selector for planning ride departure times
 * Uses native date picker with styled trigger button
 */

import { IconSymbol } from './icon-symbol'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type DepartureTimeSelectorProps = {
  /** Currently selected departure time */
  value: Date
  /** Callback when time changes */
  onChange: (date: Date) => void
  /** Optional label text */
  label?: string
  /** Minimum selectable date */
  minimumDate?: Date
  /** Test ID for testing */
  testID?: string
}

/**
 * Formats a date for display
 * Shows "Today, 2:30 PM" or "Tomorrow, 9:00 AM" or "Mar 15, 2:30 PM"
 */
const formatDepartureTime = (date: Date): string => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (targetDay.getTime() === today.getTime()) {
    return `Today, ${timeStr}`
  } else if (targetDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow, ${timeStr}`
  } else {
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return `${dateStr}, ${timeStr}`
  }
}

/**
 * DepartureTimeSelector component for selecting ride departure times
 * Displays a styled button that opens the native date/time picker
 */
export const DepartureTimeSelector = ({
  value,
  onChange,
  label = 'Departure',
  minimumDate,
  testID,
}: DepartureTimeSelectorProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme
  const [showPicker, setShowPicker] = useState(false)

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false)
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate)
    }
  }

  const displayText = formatDepartureTime(value)

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.label, { color: semantic.color.onSurface.subtle }]}>
        {label}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: semantic.color.primary.default + '1F', // Add 12% alpha
            borderColor: semantic.color.primary.default + '4D', // Add 30% alpha
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => setShowPicker(true)}
      >
        <IconSymbol
          name="clock-outline"
          size={18}
          color={semantic.color.primary.default}
          style={styles.icon}
        />
        <Text style={[styles.buttonText, { color: semantic.color.onSurface.default }]}>{displayText}</Text>
        <IconSymbol
          name="chevron-down"
          size={18}
          color={semantic.color.primary.default}
        />
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate || new Date()}
          minuteInterval={15}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  icon: {
    marginRight: -4,
  },
  buttonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
})
