/**
 * CaptionInput Component Story
 * Demonstrates multi-line input with action buttons
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { View } from 'react-native'
import { CaptionInput } from '../../components/ui/caption-input'

const meta: Meta<typeof CaptionInput> = {
  title: 'Components/CaptionInput',
  component: CaptionInput,
  parameters: {
    docs: {
      description: {
        component: 'Multi-line input with action buttons for mentions, AI assist, and send.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Input value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
  },
  args: {
    placeholder: 'Add a caption...',
    value: '',
  },
}

export default meta
type Story = StoryObj<typeof CaptionInput>

const DefaultDemo = () => {
  const [value, setValue] = useState('')
  return (
    <View style={{ width: 350 }}>
      <CaptionInput value={value} onChangeText={setValue} onSend={() => {}} placeholder="Add a caption..." />
    </View>
  )
}

export const Default: Story = {
  render: () => <DefaultDemo />,
}

const WithTextDemo = () => {
  const [value, setValue] = useState('This is an amazing route through the mountains!')
  return (
    <View style={{ width: 350 }}>
      <CaptionInput value={value} onChangeText={setValue} onSend={() => {}} placeholder="Add a caption..." />
    </View>
  )
}

export const WithText: Story = {
  render: () => <WithTextDemo />,
}

const CustomPlaceholderDemo = () => {
  const [value, setValue] = useState('')
  return (
    <View style={{ width: 350 }}>
      <CaptionInput value={value} onChangeText={setValue} onSend={() => {}} placeholder="Write a note about this ride..." />
    </View>
  )
}

export const CustomPlaceholder: Story = {
  render: () => <CustomPlaceholderDemo />,
}
