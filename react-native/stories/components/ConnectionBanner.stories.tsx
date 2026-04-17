/**
 * ConnectionBanner Component Story
 * Demonstrates connection status banner
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { ConnectionBanner } from '../../components/ui/connection-banner'

const meta: Meta<typeof ConnectionBanner> = {
  title: 'Components/ConnectionBanner',
  component: ConnectionBanner,
  parameters: {
    docs: {
      description: {
        component: 'Warning banner displayed when connection is required or limited.',
      },
    },
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof ConnectionBanner>

export const Default: Story = {
  render: () => (
    <View style={{ width: '100%' }}>
      <ConnectionBanner />
    </View>
  ),
}

export const InContext: Story = {
  render: () => (
    <View style={{ width: 350, gap: 16 }}>
      <View style={{ height: 100, backgroundColor: '#f5f5f5', borderRadius: 8 }} />
      <ConnectionBanner />
      <View style={{ height: 100, backgroundColor: '#f5f5f5', borderRadius: 8 }} />
    </View>
  ),
}
