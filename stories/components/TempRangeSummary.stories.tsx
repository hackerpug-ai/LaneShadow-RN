/**
 * Temperature Range Summary Stories
 *
 * Storybook stories for the TempRangeSummary component
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { TempRangeSummary } from '../../components/planning/temp-range-summary'
import type { TemperatureOverlay } from '../../shared/models/saved-routes'

const meta: Meta<typeof TempRangeSummary> = {
  title: 'Components/TempRangeSummary',
  component: TempRangeSummary,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <View style={{ padding: 16, backgroundColor: '#fff' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TempRangeSummary>

// Helper to create overlay
const createOverlay = (temps: number[]): TemperatureOverlay => ({
  generatedAt: Date.now(),
  modelVersion: 'test',
  legend: [],
  byLeg: [
    {
      legIndex: 0,
      segments: temps.map((temp) => ({
        level: 'mild',
        temperatureCelsius: temp,
        startMeters: 0,
        endMeters: 100,
      })),
    },
  ],
})

export const HighLow: Story = {
  args: {
    temperatureOverlay: createOverlay([17, 29]), // 63F - 84F
    testID: 'temp-range-test',
  },
}

export const Consistent: Story = {
  args: {
    temperatureOverlay: createOverlay([21, 22]), // ~70F
    testID: 'temp-range-test',
  },
}

export const ColdExtreme: Story = {
  args: {
    temperatureOverlay: createOverlay([2]), // 36F
    testID: 'temp-range-test',
  },
}

export const HotExtreme: Story = {
  args: {
    temperatureOverlay: createOverlay([35]), // 95F
    testID: 'temp-range-test',
  },
}

export const Unavailable: Story = {
  args: {
    temperatureOverlay: undefined,
    testID: 'temp-range-test',
  },
}
