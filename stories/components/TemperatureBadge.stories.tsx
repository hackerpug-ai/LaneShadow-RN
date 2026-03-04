/**
 * TemperatureBadge Component Story
 * Demonstrates temperature badges with all states
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { TemperatureBadge, TemperatureBadgeProps, TemperatureSummary } from '../../components/ui/temperature-badge'

const meta: Meta<typeof TemperatureBadge> = {
  title: 'Components/TemperatureBadge',
  component: TemperatureBadge,
  parameters: {
    docs: {
      description: {
        component: 'Badge for temperature indicators with semantic colors. Shows cold, mild, warm, hot, or unavailable states. Optionally displays actual temperature value.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    temperatureSummary: {
      control: { type: 'select' },
      options: ['cold', 'mild', 'warm', 'hot', 'unavailable'] satisfies TemperatureSummary[],
      description: 'Temperature level',
    },
    temperatureValue: {
      control: { type: 'number' },
      description: 'Optional temperature value in Fahrenheit',
    },
    testID: {
      control: 'text',
      description: 'Test ID for testing',
    },
  },
  args: {
    temperatureSummary: 'mild',
  },
}

export default meta
type Story = StoryObj<typeof TemperatureBadge>

export const Default: Story = {}

export const Cold: Story = {
  args: {
    temperatureSummary: 'cold',
    temperatureValue: 42,
  },
}

export const Mild: Story = {
  args: {
    temperatureSummary: 'mild',
    temperatureValue: 68,
  },
}

export const Warm: Story = {
  args: {
    temperatureSummary: 'warm',
    temperatureValue: 78,
  },
}

export const Hot: Story = {
  args: {
    temperatureSummary: 'hot',
    temperatureValue: 95,
  },
}

export const Unavailable: Story = {
  args: {
    temperatureSummary: 'unavailable',
  },
}

export const WithoutValue: Story = {
  args: {
    temperatureSummary: 'warm',
  },
}

export const AllStates: Story = {
  render: () => (
    <View style={{ gap: 8, alignItems: 'flex-start' }}>
      <TemperatureBadge temperatureSummary="cold" temperatureValue={42} />
      <TemperatureBadge temperatureSummary="mild" temperatureValue={68} />
      <TemperatureBadge temperatureSummary="warm" temperatureValue={78} />
      <TemperatureBadge temperatureSummary="hot" temperatureValue={95} />
      <TemperatureBadge temperatureSummary="unavailable" />
    </View>
  ),
}
