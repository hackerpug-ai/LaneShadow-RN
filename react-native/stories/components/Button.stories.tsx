/**
 * Button Component Story
 * Demonstrates button with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { Button } from '../../components/ui/button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Button with semantic theme styling. Supports multiple variants, sizes, and interactive states.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link', 'glass'],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl', '2xl', 'icon'],
      description: 'Button size',
    },
    children: {
      control: 'text',
      description: 'Button text content',
    },
    icon: {
      control: 'text',
      description: 'MaterialCommunityIcons icon name',
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Icon position',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
  },
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
    disabled: false,
    loading: false,
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: 'Default',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Learn More',
  },
}

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
}

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    children: 'Extra Large',
  },
}

export const DoubleExtraLarge: Story = {
  args: {
    size: '2xl',
    children: 'Continue',
  },
}

export const IconLeft: Story = {
  args: {
    icon: 'chevron-left',
    children: 'Back',
  },
}

export const IconRight: Story = {
  args: {
    icon: 'arrow-right',
    iconPosition: 'right',
    children: 'Next',
  },
}

export const IconOnly: Story = {
  args: {
    size: 'icon',
    icon: 'close',
  },
}

export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
}

export const Variants: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </View>
  ),
}

export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 8, alignItems: 'flex-start' }}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </View>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Button icon="chevron-left">Back</Button>
      <Button icon="plus">Add New</Button>
      <Button icon="check" iconPosition="right">Save</Button>
    </View>
  ),
}

export const IconButtons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button size="icon" icon="close" />
      <Button size="icon" icon="magnify" />
      <Button size="icon" icon="dots-vertical" />
    </View>
  ),
}

export const ButtonRow: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </View>
  ),
}
