/**
 * SectionHeader Component Story
 * Demonstrates section headers with actions
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { SectionHeader } from '../../components/ui/section-header'

const meta: Meta<typeof SectionHeader> = {
  title: 'Components/SectionHeader',
  component: SectionHeader,
  parameters: {
    docs: {
      description: {
        component: 'Section title with optional subtitle and action button. Used for screen sections.',
      },
    },
    layout: 'padded',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Section title',
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle text',
    },
    action: {
      control: 'text',
      description: 'Optional action button text',
    },
    onActionPress: {
      action: 'pressed',
      description: 'Called when action is pressed',
    },
  },
  args: {
    title: 'Saved Routes',
  },
}

export default meta
type Story = StoryObj<typeof SectionHeader>

export const Default: Story = {
  args: {
    title: 'Saved Routes',
  },
}

export const WithSubtitle: Story = {
  args: {
    title: 'Routes to Destination',
    subtitle: '3 routes found',
  },
}

export const WithAction: Story = {
  args: {
    title: 'Saved Routes',
    action: 'Edit',
  },
}

export const Complete: Story = {
  args: {
    title: 'Routes to Destination',
    subtitle: '3 routes found',
    action: 'Edit',
  },
}

export const Multiple: Story = {
  render: () => (
    <View style={{ gap: 24 }}>
      <SectionHeader title="Saved Routes" action="Edit" />
      <SectionHeader title="Routes to Destination" subtitle="3 routes found" />
      <SectionHeader title="Recent Rides" subtitle="5 completed rides" action="View All" />
    </View>
  ),
}
