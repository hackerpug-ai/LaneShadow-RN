/**
 * Banner Component Story
 * Demonstrates warning banner with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View, Pressable, Text } from 'react-native'
import { Banner } from '../../components/ui/banner'

const meta: Meta<typeof Banner> = {
  title: 'Components/Banner',
  component: Banner,
  parameters: {
    docs: {
      description: {
        component: 'Warning banner with semantic theme styling. Wraps React Native Paper Banner.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Banner visibility',
    },
    message: {
      control: 'text',
      description: 'Banner message text',
    },
    icon: {
      control: 'text',
      description: 'Icon name to display',
    },
  },
  args: {
    visible: true,
    message: 'This is a warning message',
  },
}

export default meta
type Story = StoryObj<typeof Banner>

export const Default: Story = {
  args: {
    visible: true,
    message: 'This is a warning message',
  },
}

export const WithIcon: Story = {
  args: {
    visible: true,
    message: 'Connection lost. Retrying...',
    icon: 'alert-circle',
  },
}

export const WithActions: Story = {
  render: () => {
    const [visible, setVisible] = useState(true)
    return (
      <Banner
        visible={visible}
        message="This feature requires internet access"
        actions={[{ label: 'Retry', onPress: () => {} }]}
      />
    )
  },
}

export const MultipleActions: Story = {
  render: () => {
    const [visible, setVisible] = useState(true)
    return (
      <Banner
        visible={visible}
        message="Your session is about to expire"
        actions={[
          { label: 'Refresh', onPress: () => {} },
          { label: 'Dismiss', onPress: () => setVisible(false) },
        ]}
      />
    )
  },
}

export const Dismissible: Story = {
  render: () => {
    const [visible, setVisible] = useState(true)
    return (
      <View style={{ width: 350 }}>
        <Banner
          visible={visible}
          message="This message can be dismissed"
          actions={[{ label: 'Dismiss', onPress: () => setVisible(false) }]}
        />
        {!visible && <Pressable onPress={() => setVisible(true)}><Text style={{ textDecorationLine: 'underline' }}>Show Banner</Text></Pressable>}
      </View>
    )
  },
}
