/**
 * RouteBadge Component Story
 * Demonstrates route attribute badges with variants
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { RouteBadge, RouteBadgeProps } from '../../components/ui/route-badge'

const meta: Meta<typeof RouteBadge> = {
  title: 'Components/RouteBadge',
  component: RouteBadge,
  parameters: {
    docs: {
      description: {
        component: 'Badge for route attributes with primary/neutral variants and optional icon support.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Badge text content',
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'neutral'] satisfies RouteBadgeProps['variant'][],
      description: 'Visual variant of the badge',
    },
    icon: {
      control: 'text',
      description: 'MaterialCommunityIcons icon name',
    },
    iconSize: {
      control: { type: 'number' },
      description: 'Icon size in pixels',
    },
  },
  args: {
    children: '87 mi',
    variant: 'neutral',
    iconSize: 14,
  },
}

export default meta
type Story = StoryObj<typeof RouteBadge>

export const Default: Story = {
  args: {
    children: '87 mi',
  },
}

export const Primary: Story = {
  args: {
    children: 'Most Scenic',
    variant: 'primary',
    icon: 'image',
  },
}

export const WithIcon: Story = {
  args: {
    children: '2h 15m',
    icon: 'clock-outline',
  },
}

export const BadgeSet: Story = {
  render: () => (
    <View style={{ gap: 8, alignItems: 'flex-start' }}>
      <RouteBadge variant="primary" icon="image">
        Most Scenic
      </RouteBadge>
      <RouteBadge>87 mi</RouteBadge>
      <RouteBadge icon="calendar-clock">2h 15m</RouteBadge>
      <RouteBadge icon="weather-windy" variant="primary">
        Moderate
      </RouteBadge>
    </View>
  ),
}
