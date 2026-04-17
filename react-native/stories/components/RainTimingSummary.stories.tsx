/**
 * RainTimingSummary Component Story
 * Demonstrates rain timing display with various scenarios
 */

import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { RainTimingSummary, RainTimingSummaryProps } from '../../components/planning/rain-timing-summary'
import type { RainOverlay, RouteLeg } from '../../models/saved-routes'

const mockLegs: RouteLeg[] = [
  {
    legIndex: 0,
    start: { lat: 37.7749, lng: -122.4194 },
    end: { lat: 37.7849, lng: -122.4094 },
    distanceMeters: 10000,
    durationSeconds: 1800, // 30 minutes
    geometry: {
      format: 'polyline',
      encoding: 'utf8',
      precision: 5,
      value: 'test',
    },
  },
  {
    legIndex: 1,
    start: { lat: 37.7849, lng: -122.4094 },
    end: { lat: 37.7949, lng: -122.3994 },
    distanceMeters: 10000,
    durationSeconds: 1800, // 30 minutes
    geometry: {
      format: 'polyline',
      encoding: 'utf8',
      precision: 5,
      value: 'test',
    },
  },
  {
    legIndex: 2,
    start: { lat: 37.7949, lng: -122.3994 },
    end: { lat: 37.8049, lng: -122.3894 },
    distanceMeters: 10000,
    durationSeconds: 1800, // 30 minutes
    geometry: {
      format: 'polyline',
      encoding: 'utf8',
      precision: 5,
      value: 'test',
    },
  },
]

// Helper to create rain overlay
const createRainOverlay = (levels: string[][]): RainOverlay => ({
  generatedAt: Date.now(),
  modelVersion: '1.0',
  legend: [
    { level: 'none', label: 'No rain' },
    { level: 'light', label: 'Light rain' },
    { level: 'moderate', label: 'Moderate rain' },
    { level: 'heavy', label: 'Heavy rain' },
  ],
  byLeg: levels.map((legLevels, legIndex) => ({
    legIndex,
    segments: legLevels.map((level, segIndex) => ({
      startMeters: segIndex * 5000,
      endMeters: (segIndex + 1) * 5000,
      level,
    })),
  })),
})

const meta: Meta<typeof RainTimingSummary> = {
  title: 'Components/RainTimingSummary',
  component: RainTimingSummary,
  parameters: {
    docs: {
      description: {
        component: 'Displays rain timing information for a route. Shows when rain is expected during the ride based on departure time and segment data.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    rainOverlay: {
      control: 'object',
      description: 'Rain overlay data with segments by leg',
    },
    legs: {
      control: 'object',
      description: 'Route legs with duration information',
    },
    departureTime: {
      control: 'number',
      description: 'Departure time in milliseconds',
    },
    testID: {
      control: 'text',
      description: 'Test ID for testing',
    },
  },
  args: {
    legs: mockLegs,
    departureTime: new Date('2024-01-01T13:00:00').getTime(), // 1pm
  },
}

export default meta
type Story = StoryObj<typeof RainTimingSummary>

/**
 * Default story with no rain - renders nothing
 */
export const NoRain: Story = {
  args: {
    rainOverlay: createRainOverlay([
      ['none', 'none'],
      ['none', 'none'],
      ['none', 'none'],
    ]),
    legs: mockLegs,
    departureTime: new Date('2024-01-01T13:00:00').getTime(),
  },
}

/**
 * Rain expected 2pm-3pm (departs 1pm, rain starts at leg 1)
 */
export const RainExpected2pmTo3pm: Story = {
  args: {
    rainOverlay: createRainOverlay([
      ['none', 'none'], // Leg 0: No rain
      ['light', 'light'], // Leg 1: Light rain (arrives ~2pm)
      ['light', 'light'], // Leg 2: Light rain (arrives ~2:30pm)
    ]),
    legs: mockLegs,
    departureTime: new Date('2024-01-01T13:00:00').getTime(), // 1pm
  },
}

/**
 * Rain throughout ride (all legs have rain)
 */
export const RainThroughoutRide: Story = {
  args: {
    rainOverlay: createRainOverlay([
      ['light', 'light'],
      ['light', 'light'],
      ['light', 'light'],
    ]),
    legs: mockLegs,
    departureTime: new Date('2024-01-01T13:00:00').getTime(),
  },
}

/**
 * Rain data unavailable (missing overlay)
 */
export const RainDataUnavailable: Story = {
  args: {
    rainOverlay: undefined,
    legs: mockLegs,
    departureTime: new Date('2024-01-01T13:00:00').getTime(),
  },
}

/**
 * Morning departure with rain
 */
export const MorningRain: Story = {
  args: {
    rainOverlay: createRainOverlay([
      ['none', 'none'],
      ['light', 'moderate'],
      ['moderate', 'heavy'],
    ]),
    legs: mockLegs,
    departureTime: new Date('2024-01-01T08:00:00').getTime(), // 8am
  },
}

/**
 * Evening departure with rain
 */
export const EveningRain: Story = {
  args: {
    rainOverlay: createRainOverlay([
      ['none', 'none'],
      ['light', 'light'],
      ['light', 'light'],
    ]),
    legs: mockLegs,
    departureTime: new Date('2024-01-01T17:00:00').getTime(), // 5pm
  },
}

/**
 * All scenarios side by side
 */
export const AllScenarios: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 16, width: 350 }}>
      <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
        <RainTimingSummary
          rainOverlay={createRainOverlay([
            ['none', 'none'],
            ['none', 'none'],
            ['none', 'none'],
          ])}
          legs={mockLegs}
          departureTime={new Date('2024-01-01T13:00:00').getTime()}
        />
      </View>

      <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
        <RainTimingSummary
          rainOverlay={createRainOverlay([
            ['none', 'none'],
            ['light', 'light'],
            ['light', 'light'],
          ])}
          legs={mockLegs}
          departureTime={new Date('2024-01-01T13:00:00').getTime()}
        />
      </View>

      <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
        <RainTimingSummary
          rainOverlay={createRainOverlay([
            ['light', 'light'],
            ['light', 'light'],
            ['light', 'light'],
          ])}
          legs={mockLegs}
          departureTime={new Date('2024-01-01T13:00:00').getTime()}
        />
      </View>

      <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
        <RainTimingSummary
          rainOverlay={undefined}
          legs={mockLegs}
          departureTime={new Date('2024-01-01T13:00:00').getTime()}
        />
      </View>
    </View>
  ),
}
