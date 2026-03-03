/**
 * StatRow Component Story
 * Demonstrates stat rows with icons and values
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { StatRow } from '../../components/ui/stat-row'

const meta: Meta<typeof StatRow> = {
  title: 'Components/StatRow',
  component: StatRow,
  parameters: {
    docs: {
      description: {
        component: 'Row displaying stat with icon and value. Used for duration, distance, wind level, etc.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    icon: {
      control: 'text',
      description: 'MaterialCommunityIcons icon name',
    },
    value: {
      control: 'text',
      description: 'Value text to display',
    },
    iconSize: {
      control: { type: 'number' },
      description: 'Icon size in pixels',
    },
  },
  args: {
    icon: 'schedule',
    value: '2h 15m',
    iconSize: 18,
  },
}

export default meta
type Story = StoryObj<typeof StatRow>

export const Default: Story = {}

export const Duration: Story = {
  args: {
    icon: 'schedule',
    value: '2h 15m',
  },
}

export const Distance: Story = {
  args: {
    icon: 'straighten',
    value: '87 mi',
  },
}

export const Wind: Story = {
  args: {
    icon: 'air',
    value: 'Moderate',
  },
}

export const Multiple: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <StatRow icon="calendar-clock" value="2h 15m" />
      <StatRow icon="arrow-collapse-horizontal" value="87 mi" />
      <StatRow icon="air" value="Moderate" />
    </View>
  ),
}
