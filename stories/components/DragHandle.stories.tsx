/**
 * DragHandle Component Story
 * Demonstrates bottom sheet drag handle variations
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { DragHandle } from '../../components/ui/drag-handle'

const meta: Meta<typeof DragHandle> = {
  title: 'Components/DragHandle',
  component: DragHandle,
  parameters: {
    docs: {
      description: {
        component: 'Visual affordance for draggable bottom sheets. Standard Material Design 3 drag handle indicator.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    width: {
      control: { type: 'number' },
      description: 'Width of the drag handle in pixels',
    },
    height: {
      control: { type: 'number' },
      description: 'Height of the drag handle in pixels',
    },
    borderRadius: {
      control: { type: 'number' },
      description: 'Border radius of the drag handle',
    },
  },
  args: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
}

export default meta
type Story = StoryObj<typeof DragHandle>

export const Default: Story = {}

export const Wide: Story = {
  args: {
    width: 48,
  },
}

export const Thick: Story = {
  args: {
    height: 6,
  },
}

export const Rounded: Story = {
  args: {
    height: 6,
    borderRadius: 3,
  },
}

export const InContext: Story = {
  render: (args) => (
    <View style={{ padding: 24, width: 300, backgroundColor: '#1A1C1F' }}>
      <DragHandle {...args} />
    </View>
  ),
}
