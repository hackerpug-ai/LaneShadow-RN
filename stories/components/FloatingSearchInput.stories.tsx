/**
 * FloatingSearchInput Component Story
 * Demonstrates floating search input with loading and clear states
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View } from 'react-native'
import { FloatingSearchInput } from '../../components/ui/floating-search-input'

const meta: Meta<typeof FloatingSearchInput> = {
  title: 'Components/FloatingSearchInput',
  component: FloatingSearchInput,
  parameters: {
    docs: {
      description: {
        component: 'Floating search input with loading state, clear button, and press-to-search functionality.',
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
    isLoading: {
      control: 'boolean',
      description: 'Loading state with activity indicator',
    },
  },
  args: {
    placeholder: 'Search...',
    value: '',
    isLoading: false,
  },
}

export default meta
type Story = StoryObj<typeof FloatingSearchInput>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <View style={{ width: 350 }}>
        <FloatingSearchInput
          value={value}
          onChangeText={setValue}
          placeholder="Search locations..."
          onClear={() => setValue('')}
        />
      </View>
    )
  },
}

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState('San Francisco')
    return (
      <View style={{ width: 350 }}>
        <FloatingSearchInput
          value={value}
          onChangeText={setValue}
          placeholder="Search locations..."
          onClear={() => setValue('')}
        />
      </View>
    )
  },
}

export const Loading: Story = {
  render: () => {
    const [value, setValue] = useState('Golden Gate')
    return (
      <View style={{ width: 350 }}>
        <FloatingSearchInput
          value={value}
          onChangeText={setValue}
          placeholder="Search locations..."
          isLoading={true}
          onCancelLoading={() => setValue('')}
        />
      </View>
    )
  },
}

export const Pressable: Story = {
  render: () => {
    const [value, setValue] = useState('')
    const [focused, setFocused] = useState(false)
    return (
      <View style={{ width: 350 }}>
        <FloatingSearchInput
          value={value}
          onChangeText={setValue}
          placeholder="Where to?"
          onPress={() => setFocused(true)}
        />
      </View>
    )
  },
}

export const InContext: Story = {
  render: () => {
    const [search, setSearch] = useState('')
    return (
      <View style={{ width: '100%', padding: 16, backgroundColor: '#f5f5f5' }}>
        <FloatingSearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search for routes, locations..."
          onClear={() => setSearch('')}
        />
      </View>
    )
  },
}
