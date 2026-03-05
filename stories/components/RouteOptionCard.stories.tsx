/**
 * RouteOptionCard Component Story
 * Demonstrates route option cards with selected and compact variants
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { RouteOptionCard } from '../../components/ui/route-option-card'

const meta: Meta<typeof RouteOptionCard> = {
  title: 'Components/RouteOptionCard',
  component: RouteOptionCard,
  parameters: {
    docs: {
      description: {
        component: 'Card displaying route option with name, badges, stats, weather summary. Supports selected and compact variants.',
      },
    },
    layout: 'padded',
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Route name',
    },
    variant: {
      control: { type: 'select' },
      options: ['selected', 'compact'] as const,
      description: 'Card variant',
    },
    badges: {
      control: 'object',
      description: 'Array of badges to display',
    },
    stats: {
      control: 'object',
      description: 'Array of stats to display',
    },
    weatherSummary: {
      control: 'text',
      description: 'Weather condition description',
    },
    weatherIcon: {
      control: 'text',
      description: 'Weather icon name',
    },
    compactStats: {
      control: 'text',
      description: 'Compact stats string (for variant="compact")',
    },
  },
}

export default meta
type Story = StoryObj<typeof RouteOptionCard>

export const Selected: Story = {
  args: {
    name: 'Scenic Route',
    variant: 'selected',
    badges: [
      { icon: 'landscape', label: 'Most Scenic', variant: 'primary' },
      { label: '87 mi', variant: 'neutral' },
    ],
    stats: [
      { icon: 'schedule', value: '2h 15m' },
      { icon: 'air', value: 'Moderate' },
    ],
    weatherSummary: 'Light crosswinds on Hwy 1',
    weatherIcon: 'air',
  },
}

export const Compact: Story = {
  args: {
    name: 'Direct Route',
    variant: 'compact',
    compactStats: '1h 45m • 72 mi',
  },
}

export const Balanced: Story = {
  args: {
    name: 'Balanced Route',
    variant: 'compact',
    compactStats: '2h 00m • 79 mi',
  },
}

export const Multiple: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <RouteOptionCard
        name="Scenic Route"
        variant="selected"
        badges={[
          { icon: 'landscape', label: 'Most Scenic', variant: 'primary' },
          { label: '87 mi', variant: 'neutral' },
        ]}
        stats={[
          { icon: 'schedule', value: '2h 15m' },
          { icon: 'air', value: 'Moderate' },
        ]}
        weatherSummary="Light crosswinds on Hwy 1"
      />
      <RouteOptionCard
        name="Direct Route"
        variant="compact"
        compactStats="1h 45m • 72 mi"
      />
      <RouteOptionCard
        name="Balanced Route"
        variant="compact"
        compactStats="2h 00m • 79 mi"
      />
    </View>
  ),
}

// Stories for the RouteOptionCard component from components/planning/route-option-card.tsx
// This demonstrates the rain badge integration with PlannedRouteOptionView data

import { RouteOptionCard as PlanningRouteOptionCard } from '../../components/planning/route-option-card'

export const WithRainNoPrecipitation: Story = {
  render: () => {
    const mockRoute = {
      routeOptionId: 'route-1',
      label: 'Dry Coast Ride',
      rationale: 'No rain expected throughout the route',
      stats: {
        distanceMeters: 45000,
        durationSeconds: 5400,
        legsCount: 3,
      },
      map: {
        bounds: { north: 37.8, south: 37.6, east: -122.4, west: -122.6 },
        overviewGeometry: { format: 'polyline' as const, encoding: 'google', precision: 5, value: 'test' },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'low' as const,
        rainSummary: 'none' as const,
        conditionsStatus: 'ok' as const,
      },
    }
    return (
      <View style={{ padding: 16 }}>
        <PlanningRouteOptionCard
          routeOption={mockRoute}
          isSelected={true}
          onSelect={() => {}}
          testID="rain-no-rain"
        />
      </View>
    )
  },
}

export const WithLightRain: Story = {
  render: () => {
    const mockRoute = {
      routeOptionId: 'route-2',
      label: 'Light Drizzle Route',
      rationale: 'Light rain in some areas',
      stats: {
        distanceMeters: 52000,
        durationSeconds: 6300,
        legsCount: 4,
      },
      map: {
        bounds: { north: 37.8, south: 37.6, east: -122.4, west: -122.6 },
        overviewGeometry: { format: 'polyline' as const, encoding: 'google', precision: 5, value: 'test' },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'moderate' as const,
        rainSummary: 'light' as const,
        conditionsStatus: 'ok' as const,
      },
    }
    return (
      <View style={{ padding: 16 }}>
        <PlanningRouteOptionCard
          routeOption={mockRoute}
          isSelected={true}
          onSelect={() => {}}
          testID="rain-light"
        />
      </View>
    )
  },
}

export const WithModerateRain: Story = {
  render: () => {
    const mockRoute = {
      routeOptionId: 'route-3',
      label: 'Rainy Mountain Pass',
      rationale: 'Moderate rain expected at higher elevation',
      stats: {
        distanceMeters: 68000,
        durationSeconds: 7200,
        legsCount: 5,
      },
      map: {
        bounds: { north: 37.8, south: 37.6, east: -122.4, west: -122.6 },
        overviewGeometry: { format: 'polyline' as const, encoding: 'google', precision: 5, value: 'test' },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'high' as const,
        rainSummary: 'moderate' as const,
        conditionsStatus: 'ok' as const,
      },
    }
    return (
      <View style={{ padding: 16 }}>
        <PlanningRouteOptionCard
          routeOption={mockRoute}
          isSelected={true}
          onSelect={() => {}}
          testID="rain-moderate"
        />
      </View>
    )
  },
}

export const WithHeavyRain: Story = {
  render: () => {
    const mockRoute = {
      routeOptionId: 'route-4',
      label: 'Storm Route',
      rationale: 'Heavy rain warning in effect',
      stats: {
        distanceMeters: 38000,
        durationSeconds: 4500,
        legsCount: 2,
      },
      map: {
        bounds: { north: 37.8, south: 37.6, east: -122.4, west: -122.6 },
        overviewGeometry: { format: 'polyline' as const, encoding: 'google', precision: 5, value: 'test' },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'high' as const,
        rainSummary: 'heavy' as const,
        conditionsStatus: 'ok' as const,
      },
    }
    return (
      <View style={{ padding: 16 }}>
        <PlanningRouteOptionCard
          routeOption={mockRoute}
          isSelected={true}
          onSelect={() => {}}
          testID="rain-heavy"
        />
      </View>
    )
  },
}

export const WithUnavailableRain: Story = {
  render: () => {
    const mockRoute = {
      routeOptionId: 'route-5',
      label: 'Data Unavailable Route',
      rationale: 'Weather data not available for this route',
      stats: {
        distanceMeters: 41000,
        durationSeconds: 5100,
        legsCount: 3,
      },
      map: {
        bounds: { north: 37.8, south: 37.6, east: -122.4, west: -122.6 },
        overviewGeometry: { format: 'polyline' as const, encoding: 'google', precision: 5, value: 'test' },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'unavailable' as const,
        rainSummary: 'unavailable' as const,
        conditionsStatus: 'unavailable' as const,
      },
    }
    return (
      <View style={{ padding: 16 }}>
        <PlanningRouteOptionCard
          routeOption={mockRoute}
          isSelected={false}
          onSelect={() => {}}
          testID="rain-unavailable"
        />
      </View>
    )
  },
}
