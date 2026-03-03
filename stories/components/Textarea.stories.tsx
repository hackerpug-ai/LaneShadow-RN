/**
 * Textarea Component Story
 * Demonstrates multi-line text input field
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View } from 'react-native'
import { Textarea } from '../../components/ui/textarea'

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component: 'Multi-line text input field with minimum height and focus states.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
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
      description: 'Whether the textarea is editable',
    },
    error: {
      control: 'boolean',
      description: 'Error state styling',
    },
    numberOfLines: {
      control: 'number',
      description: 'Number of visible lines',
    },
  },
  args: {
    placeholder: 'Enter multiple lines of text...',
    editable: true,
    error: false,
    numberOfLines: 4,
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: {
    placeholder: 'Enter multiple lines of text...',
  },
}

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState('This is a multi-line text input.\nYou can type as much as you want.')
    return <Textarea value={value} onChangeText={setValue} placeholder="Enter text..." />
  },
}

export const Error: Story = {
  args: {
    placeholder: 'Enter description',
    error: true,
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Cannot edit this textarea',
    editable: false,
  },
}

export const Short: Story = {
  args: {
    placeholder: 'Short textarea',
    numberOfLines: 2,
  },
}

export const Tall: Story = {
  args: {
    placeholder: 'Tall textarea',
    numberOfLines: 8,
  },
}

export const InContext: Story = {
  render: () => {
    const [description, setDescription] = useState('')
    return (
      <View style={{ width: 350, padding: 16, gap: 8 }}>
        <Textarea value={description} onChangeText={setDescription} placeholder="Describe your route..." numberOfLines={5} />
      </View>
    )
  },
}
