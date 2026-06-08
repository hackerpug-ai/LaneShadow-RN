/**
 * PrimaryButton Component Story
 * Demonstrates copper-styled primary button
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { PrimaryButton } from '../../components/ui/primary-button'

const meta: Meta<typeof PrimaryButton> = {
  title: 'Components/PrimaryButton',
  component: PrimaryButton,
  parameters: {
    docs: {
      description: {
        component: 'Primary action button with copper styling and glow effect. Main action button for primary actions.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Button text content',
    },
    icon: {
      control: 'text',
      description: 'MaterialCommunityIcons icon name',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    height: {
      control: { type: 'number' },
      description: 'Button height in pixels',
    },
    onPress: {
      action: 'pressed',
      description: 'Called when button is pressed',
    },
  },
  args: {
    children: 'View Details',
    loading: false,
    disabled: false,
    height: 56,
  },
}

export default meta
type Story = StoryObj<typeof PrimaryButton>

export const Default: Story = {}

export const WithIcon: Story = {
  args: {
    children: 'View Details',
    icon: 'chevron-right',
  },
}

export const Loading: Story = {
  args: {
    children: 'View Details',
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    children: 'View Details',
    disabled: true,
  },
}

export const Small: Story = {
  args: {
    children: 'Save Route',
    height: 48,
  },
}

export const InContext: Story = {
  render: (args) => (
    <View style={{ padding: 24, width: 300, gap: 16 }}>
      <PrimaryButton {...args} />
      <PrimaryButton {...args} icon="chevron-right" />
      <PrimaryButton {...args} loading />
    </View>
  ),
}
