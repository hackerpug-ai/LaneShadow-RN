/**
 * RainBadge Component Story
 * Demonstrates rain intensity badges with all states
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { RainBadge, RainBadgeProps, RainSummary } from '../../components/ui/rain-badge'

const meta: Meta<typeof RainBadge> = {
  title: 'Components/RainBadge',
  component: RainBadge,
  parameters: {
    docs: {
      description: {
        component: 'Badge for rain intensity indicators with semantic colors. Shows none, light, moderate, heavy, or unavailable states.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    rainSummary: {
      control: { type: 'select' },
      options: ['none', 'light', 'moderate', 'heavy', 'unavailable'] satisfies RainSummary[],
      description: 'Rain intensity level',
    },
    testID: {
      control: 'text',
      description: 'Test ID for testing',
    },
  },
  args: {
    rainSummary: 'none',
  },
}

export default meta
type Story = StoryObj<typeof RainBadge>

export const Default: Story = {}

export const NoRain: Story = {
  args: {
    rainSummary: 'none',
  },
}

export const LightRain: Story = {
  args: {
    rainSummary: 'light',
  },
}

export const ModerateRain: Story = {
  args: {
    rainSummary: 'moderate',
  },
}

export const HeavyRain: Story = {
  args: {
    rainSummary: 'heavy',
  },
}

export const Unavailable: Story = {
  args: {
    rainSummary: 'unavailable',
  },
}

export const AllStates: Story = {
  render: () => (
    <View style={{ gap: 8, alignItems: 'flex-start' }}>
      <RainBadge rainSummary="none" />
      <RainBadge rainSummary="light" />
      <RainBadge rainSummary="moderate" />
      <RainBadge rainSummary="heavy" />
      <RainBadge rainSummary="unavailable" />
    </View>
  ),
}
