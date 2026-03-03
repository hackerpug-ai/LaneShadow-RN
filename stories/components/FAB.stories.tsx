/**
 * FAB Component Story
 * Demonstrates floating action button with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { FAB } from '../../components/ui/fab'

const meta: Meta<typeof FAB> = {
  title: 'Components/FAB',
  component: FAB,
  parameters: {
    docs: {
      description: {
        component: 'Floating action button with semantic theme styling. Wraps React Native Paper FAB.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    icon: {
      control: 'text',
      description: 'MaterialCommunityIcons icon name',
    },
    label: {
      control: 'text',
      description: 'Optional label text',
    },
    visible: {
      control: 'boolean',
      description: 'Visibility state',
    },
  },
  args: {
    icon: 'plus',
    label: undefined,
    visible: true,
  },
}

export default meta
type Story = StoryObj<typeof FAB>

export const Default: Story = {
  args: {
    icon: 'plus',
  },
}

export const WithLabel: Story = {
  args: {
    icon: 'plus',
    label: 'Add Route',
  },
}

export const Edit: Story = {
  args: {
    icon: 'pencil',
  },
}

export const Navigate: Story = {
  args: {
    icon: 'navigation',
    label: 'Start',
  },
}

export const Location: Story = {
  args: {
    icon: 'crosshairs-gps',
  },
}

export const Hidden: Story = {
  args: {
    icon: 'plus',
    visible: false,
  },
}

export const InContext: Story = {
  render: () => (
    <View style={{ width: '100%', height: 200, backgroundColor: '#f5f5f5', position: 'relative' }}>
      <View style={{ position: 'absolute', bottom: 16, right: 16 }}>
        <FAB icon="plus" onPress={() => {}} />
      </View>
    </View>
  ),
}
