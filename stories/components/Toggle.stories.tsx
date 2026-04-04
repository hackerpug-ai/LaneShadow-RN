/**
 * Toggle Component Story
 * Demonstrates toggle button with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View } from 'react-native'
import { Toggle } from '../../components/ui/toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    docs: {
      description: {
        component: 'Toggle button with semantic theme styling. Supports different sizes and variants.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    pressed: {
      control: 'boolean',
      description: 'Pressed/active state',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
  args: {
    pressed: false,
    variant: 'default',
    size: 'default',
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof Toggle>

export const Default: Story = {
  args: {
    children: 'Toggle',
    pressed: false,
  },
}

export const Pressed: Story = {
  args: {
    children: 'Active',
    pressed: true,
  },
}

export const Outline: Story = {
  args: {
    children: 'Toggle',
    variant: 'outline',
    pressed: false,
  },
}

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
}

const InteractiveDemo = () => {
  const [pressed, setPressed] = useState(false)
  return (
    <View style={{ padding: 16 }}>
      <Toggle pressed={pressed} onPressedChange={setPressed}>
        {pressed ? 'On' : 'Off'}
      </Toggle>
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
}

export const Sizes: Story = {
  render: () => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Toggle size="sm" pressed={false}>Small</Toggle>
        <Toggle size="default" pressed={false}>Default</Toggle>
        <Toggle size="lg" pressed={false}>Large</Toggle>
      </View>
    )
  },
}

export const Variants: Story = {
  render: () => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Toggle variant="default" pressed={false}>Default</Toggle>
        <Toggle variant="default" pressed={true}>Active</Toggle>
        <Toggle variant="outline" pressed={false}>Outline</Toggle>
        <Toggle variant="outline" pressed={true}>Active</Toggle>
      </View>
    )
  },
}
