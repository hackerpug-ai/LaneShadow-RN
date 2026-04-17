/**
 * AppHeader Component Story
 * Demonstrates reusable app header with flexible content slots
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { AppHeader } from '../../components/ui/app-header'

const meta: Meta<typeof AppHeader> = {
  title: 'Components/AppHeader',
  component: AppHeader,
  parameters: {
    docs: {
      description: {
        component: 'Reusable app header with flexible content slots for title, left icon/button, and right content.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Header title text',
    },
    leftIcon: {
      control: 'text',
      description: 'Left icon name',
    },
    rightIcon: {
      control: 'text',
      description: 'Right icon name',
    },
  },
  args: {
    title: 'Header',
  },
}

export default meta
type Story = StoryObj<typeof AppHeader>

export const Default: Story = {
  args: {
    title: 'Home',
  },
}

export const WithLeftIcon: Story = {
  args: {
    title: 'Settings',
    leftIcon: 'arrow-left',
    onLeftPress: () => {},
  },
}

export const WithRightIcon: Story = {
  args: {
    title: 'Profile',
    rightIcon: 'cog',
    onRightPress: () => {},
  },
}

export const WithBothIcons: Story = {
  args: {
    title: 'Details',
    leftIcon: 'arrow-left',
    rightIcon: 'dots-vertical',
    onLeftPress: () => {},
    onRightPress: () => {},
  },
}

export const WithAvatar: Story = {
  args: {
    title: 'My Profile',
    leftIcon: 'arrow-left',
    rightAvatar: { initials: 'JD' },
    onLeftPress: () => {},
    onRightPress: () => {},
  },
}

export const CustomContent: Story = {
  render: () => (
    <AppHeader
      title="Custom"
      leftContent={<Pressable onPress={() => {}}><Text>Custom</Text></Pressable>}
      rightContent={<Text>Action</Text>}
    />
  ),
}

export const FullWidth: Story = {
  render: () => (
    <View style={{ width: '100%' }}>
      <AppHeader title="Full Width" leftIcon="menu" onLeftPress={() => {}} />
    </View>
  ),
}
