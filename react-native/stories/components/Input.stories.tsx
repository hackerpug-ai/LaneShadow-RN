/**
 * Input Component Story
 * Demonstrates text input field with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { View } from 'react-native'
import { Input } from '../../components/ui/input'

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component: 'Text input field with semantic theme styling. Supports labels, icons, focus states, and error styling.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Optional label rendered above the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
    editable: {
      control: 'boolean',
      description: 'Whether the input is editable',
    },
    error: {
      control: 'boolean',
      description: 'Error state styling',
    },
    leftIcon: {
      control: 'text',
      description: 'Left icon name (MaterialCommunityIcons)',
    },
    rightIcon: {
      control: 'text',
      description: 'Right icon name (MaterialCommunityIcons)',
    },
  },
  args: {
    placeholder: 'Enter text...',
    editable: true,
    error: false,
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
  },
}

const WithValueDemo = () => {
  const [value, setValue] = useState('john@example.com')
  return <Input value={value} onChangeText={setValue} placeholder="Email" />
}

export const WithValue: Story = {
  render: () => <WithValueDemo />,
}

export const WithLeftIcon: Story = {
  args: {
    placeholder: 'Search...',
    leftIcon: 'magnify',
  },
}

export const WithRightIcon: Story = {
  args: {
    placeholder: 'Enter password',
    rightIcon: 'eye-off',
  },
}

export const WithBothIcons: Story = {
  args: {
    label: 'Location',
    placeholder: 'Enter location',
    leftIcon: 'map-marker',
    rightIcon: 'crosshairs-gps',
  },
}

export const Error: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    error: true,
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Field',
    placeholder: 'Cannot edit this',
    editable: false,
  },
}

const InFormDemo = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <View style={{ width: 300, gap: 16 }}>
      <Input label="Email" placeholder="your@email.com" value={email} onChangeText={setEmail} leftIcon="email" />
      <Input label="Password" placeholder="Enter password" value={password} onChangeText={setPassword} rightIcon="eye-off" secureTextEntry />
    </View>
  )
}

export const InForm: Story = {
  render: () => <InFormDemo />,
}
