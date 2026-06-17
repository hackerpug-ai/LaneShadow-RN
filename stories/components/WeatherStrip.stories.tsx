/**
 * WeatherStrip Component Story
 * Demonstrates compact weather strip with worst condition highlighting
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { WeatherStrip, WeatherStripProps } from '../../components/planning/weather-strip'
import type { RouteOverlays } from '../../shared/models/saved-routes'

const meta: Meta<typeof WeatherStrip> = {
  title: 'Components/WeatherStrip',
  component: WeatherStrip,
  parameters: {
    docs: {
      description: {
        component: 'Compact horizontal strip displaying all three weather indicators (wind/rain/temp) with the worst condition highlighted. Tap to expand and see all badges.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    overlays: {
      description: 'Route overlays containing wind, rain, and temperature data',
    },
    testID: {
      control: 'text',
      description: 'Test ID for testing',
    },
  },
  args: {
    overlays: {
      rain: {
        generatedAt: Date.now(),
        modelVersion: 'test-v1',
        legend: [{ level: 'none', label: 'No Rain' }],
        byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 1000, level: 'none' }] }],
      },
      wind: {
        generatedAt: Date.now(),
        modelVersion: 'test-v1',
        legend: [{ level: 'low', label: 'Low Wind' }],
        byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 1000, level: 'low' }] }],
      },
      temperature: {
        generatedAt: Date.now(),
        modelVersion: 'test-v1',
        legend: [{ level: 'mild', label: 'Mild' }],
        byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 1000, level: 'mild' }] }],
      },
    } as RouteOverlays,
  },
}

export default meta
type Story = StoryObj<typeof WeatherStrip>

// Helper to create mock overlays
const createOverlays = (conditions: {
  rain?: 'none' | 'light' | 'moderate' | 'heavy'
  wind?: 'low' | 'moderate' | 'high'
  temperature?: 'cold' | 'mild' | 'warm' | 'hot'
}): RouteOverlays => ({
  rain: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [{ level: 'none', label: 'No Rain' }],
    byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 1000, level: conditions.rain ?? 'none' }] }],
  },
  wind: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [{ level: 'low', label: 'Low Wind' }],
    byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 1000, level: conditions.wind ?? 'low' }] }],
  },
  temperature: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [{ level: 'mild', label: 'Mild' }],
    byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 1000, level: conditions.temperature ?? 'mild' }] }],
  },
})

export const GoodConditions: Story = {
  args: {
    overlays: createOverlays({ rain: 'none', wind: 'low', temperature: 'mild' }),
  },
  parameters: {
    docs: {
      description: {
        story: 'All weather conditions are favorable - shows "Good conditions" badge in green.',
      },
    },
  },
}

export const HeavyRain: Story = {
  args: {
    overlays: createOverlays({ rain: 'heavy', wind: 'low', temperature: 'mild' }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Heavy rain is the worst condition - highlights rain badge as primary concern.',
      },
    },
  },
}

export const HighWind: Story = {
  args: {
    overlays: createOverlays({ rain: 'none', wind: 'high', temperature: 'mild' }),
  },
  parameters: {
    docs: {
      description: {
        story: 'High wind is the worst condition - highlights wind badge.',
      },
    },
  },
}

export const HotTemperature: Story = {
  args: {
    overlays: createOverlays({ rain: 'none', wind: 'low', temperature: 'hot' }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Hot temperature is the worst condition - highlights temperature badge.',
      },
    },
  },
}

export const MultipleWarnings: Story = {
  args: {
    overlays: createOverlays({ rain: 'heavy', wind: 'high', temperature: 'hot' }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple concerning conditions - shows worst (rain) with additional warnings indicator (+2). Tap to expand.',
      },
    },
  },
}

export const RainAndWind: Story = {
  args: {
    overlays: createOverlays({ rain: 'moderate', wind: 'high', temperature: 'mild' }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Rain has priority over wind when both are severe - rain badge is highlighted.',
      },
    },
  },
}

export const AllStates: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start', padding: 16 }}>
      <View style={{ gap: 4 }}>
        <WeatherStrip overlays={createOverlays({ rain: 'none', wind: 'low', temperature: 'mild' })} />
      </View>
      <View style={{ gap: 4 }}>
        <WeatherStrip overlays={createOverlays({ rain: 'heavy', wind: 'low', temperature: 'mild' })} />
      </View>
      <View style={{ gap: 4 }}>
        <WeatherStrip overlays={createOverlays({ rain: 'none', wind: 'high', temperature: 'mild' })} />
      </View>
      <View style={{ gap: 4 }}>
        <WeatherStrip overlays={createOverlays({ rain: 'none', wind: 'low', temperature: 'hot' })} />
      </View>
      <View style={{ gap: 4 }}>
        <WeatherStrip overlays={createOverlays({ rain: 'heavy', wind: 'high', temperature: 'hot' })} />
      </View>
    </View>
  ),
}
