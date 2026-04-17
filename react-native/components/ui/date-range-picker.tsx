/**
 * DateRangePicker Component
 *
 * Chip-style date range picker with preset options for filtering routes by creation date.
 * Follows semantic theme patterns from saved-route-card.tsx and chip.tsx.
 */

import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type DateRangePreset = 'all' | 'week' | 'month' | '3months'

type DateRange = {
  afterDate?: number
  beforeDate?: number
}

export type DateRangePickerProps = {
  onDateRangeChange: (range: DateRange) => void
  testID?: string
}

const PRESETS: { key: DateRangePreset; label: string; daysBack?: number }[] = [
  { key: 'all', label: 'All time' },
  { key: 'week', label: 'Last week', daysBack: 7 },
  { key: 'month', label: 'Last month', daysBack: 30 },
  { key: '3months', label: 'Last 3 months', daysBack: 90 },
]

function getDateRange(preset: DateRangePreset): DateRange {
  const found = PRESETS.find((p) => p.key === preset)
  if (!found?.daysBack) {
    return { afterDate: undefined, beforeDate: undefined }
  }
  const afterDate = Date.now() - found.daysBack * 24 * 60 * 60 * 1000
  return { afterDate, beforeDate: undefined }
}

export const DateRangePicker = ({
  onDateRangeChange,
  testID = 'date-range-picker',
}: DateRangePickerProps) => {
  const { semantic } = useSemanticTheme()
  const [selected, setSelected] = useState<DateRangePreset>('all')

  const handlePress = (key: DateRangePreset) => {
    if (key === 'all') {
      setSelected('all')
      onDateRangeChange({ afterDate: undefined, beforeDate: undefined })
      return
    }
    if (key === selected) {
      // Toggle off — deselect back to "All time"
      setSelected('all')
      onDateRangeChange({ afterDate: undefined, beforeDate: undefined })
      return
    }
    setSelected(key)
    onDateRangeChange(getDateRange(key))
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: semantic.space.sm,
        paddingHorizontal: semantic.space.md,
      }}
      testID={testID}
    >
      {PRESETS.map((preset) => {
        const isSelected = selected === preset.key
        return (
          <Pressable
            key={preset.key}
            testID={`${testID}-chip-${preset.key}`}
            onPress={() => handlePress(preset.key)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? semantic.color.primary.default
                  : semantic.color.surfaceVariant.default,
                borderRadius: semantic.radius.full,
                paddingHorizontal: semantic.space.md,
                paddingVertical: semantic.space.sm,
              },
            ]}
          >
            <Text
              style={[
                semantic.type.label.sm,
                {
                  color: isSelected
                    ? semantic.color.onPrimary.default
                    : semantic.color.onSurface.default,
                },
              ]}
            >
              {preset.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
})
