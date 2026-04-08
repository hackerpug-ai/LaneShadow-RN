/**
 * PreferencesRow Component
 *
 * A compact horizontal row of 4 preference chips for the Plan Ride sheet.
 * Replaces the full-height ScenicBiasSegmented, DepartureTimeSelector, and
 * toggle section with a single ~44px row so the sheet fits without scrolling.
 *
 * Chips:
 *   1. Scenic bias  — mountain icon, active when value is "high"
 *   2. Departure time — clock icon + formatted time text, opens date picker on press
 *   3. Avoid highways — road icon, toggleable
 *   4. Avoid tolls    — cash icon, toggleable
 */

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { ScenicBias } from '../ui/scenic-bias-segmented'
import { IconSymbol } from '../ui/icon-symbol'

export type PreferencesRowProps = {
  scenicBias: ScenicBias
  onSetScenicBias: (next: ScenicBias) => void
  avoidHighways: boolean
  onToggleAvoidHighways: () => void
  avoidTolls: boolean
  onToggleAvoidTolls: () => void
  departureTime: Date
  onSetDepartureTime: (date: Date) => void
  includeFavorites: boolean
  onToggleIncludeFavorites: () => void
  hasFavorites: boolean
}

/**
 * Formats a Date for the departure chip label.
 * Returns "Today, 2:30 PM", "Tomorrow, 9:00 AM", or "Mar 15, 2:30 PM".
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

export const PreferencesRow = ({
  scenicBias,
  onSetScenicBias,
  avoidHighways,
  onToggleAvoidHighways,
  avoidTolls,
  onToggleAvoidTolls,
  departureTime,
  onSetDepartureTime,
  includeFavorites,
  onToggleIncludeFavorites,
  hasFavorites,
}: PreferencesRowProps) => {
  const { semantic } = useSemanticTheme()
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleScenicBiasPress = () => {
    onSetScenicBias(scenicBias === 'high' ? 'default' : 'high')
  }

  const handleDatePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (event.type === 'set' && selectedDate) {
      onSetDepartureTime(selectedDate)
    }
  }

  const activeBackground = semantic.color.primary.default
  const activeIconColor = semantic.color.onPrimary.default
  const activeTextColor = semantic.color.onPrimary.default
  const inactiveBackground = semantic.color.surfaceVariant.default
  const inactiveIconColor = semantic.color.onSurface.muted
  const inactiveTextColor = semantic.color.onSurface.muted

  const isScenicActive = scenicBias === 'high'

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Scenic Bias Chip */}
        <Pressable
          onPress={handleScenicBiasPress}
          testID="pref-chip-scenic-bias"
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: isScenicActive ? activeBackground : inactiveBackground,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <IconSymbol
            name="image"
            size={16}
            color={isScenicActive ? activeIconColor : inactiveIconColor}
          />
          <Text
            style={[
              styles.chipText,
              { color: isScenicActive ? activeTextColor : inactiveTextColor },
            ]}
          >
            Scenic
          </Text>
        </Pressable>

        {/* Departure Time Chip */}
        <Pressable
          onPress={() => setShowDatePicker(true)}
          testID="pref-chip-departure-time"
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: inactiveBackground,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <IconSymbol name="clock-outline" size={16} color={inactiveIconColor} />
          <Text style={[styles.chipText, { color: inactiveTextColor }]}>
            {formatDepartureTime(departureTime)}
          </Text>
        </Pressable>

        {/* Avoid Highways Chip */}
        <Pressable
          onPress={onToggleAvoidHighways}
          testID="pref-chip-avoid-highways"
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: avoidHighways ? activeBackground : inactiveBackground,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <IconSymbol
            name="highway"
            size={16}
            color={avoidHighways ? activeIconColor : inactiveIconColor}
          />
          <Text
            style={[
              styles.chipText,
              { color: avoidHighways ? activeTextColor : inactiveTextColor },
            ]}
          >
            No Highways
          </Text>
        </Pressable>

        {/* Avoid Tolls Chip */}
        <Pressable
          onPress={onToggleAvoidTolls}
          testID="pref-chip-avoid-tolls"
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: avoidTolls ? activeBackground : inactiveBackground,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <IconSymbol
            name="cash"
            size={16}
            color={avoidTolls ? activeIconColor : inactiveIconColor}
          />
          <Text
            style={[styles.chipText, { color: avoidTolls ? activeTextColor : inactiveTextColor }]}
          >
            No Tolls
          </Text>
        </Pressable>

        {/* Include Favorite Roads Chip */}
        <Pressable
          onPress={onToggleIncludeFavorites}
          testID="pref-chip-include-favorites"
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: includeFavorites ? activeBackground : inactiveBackground,
              opacity: pressed || !hasFavorites ? 0.5 : 1,
            },
          ]}
        >
          <IconSymbol
            name="heart"
            size={16}
            color={includeFavorites ? activeIconColor : inactiveIconColor}
          />
          <Text
            style={[styles.chipText, { color: includeFavorites ? activeTextColor : inactiveTextColor }]}
          >
            Favorites
          </Text>
        </Pressable>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={departureTime}
          mode="datetime"
          display="default"
          onChange={handleDatePickerChange}
          minimumDate={new Date()}
          minuteInterval={15}
        />
      )}
    </View>
  )
}

PreferencesRow.displayName = 'PreferencesRow'

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
})
