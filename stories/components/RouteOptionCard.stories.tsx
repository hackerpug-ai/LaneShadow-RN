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
