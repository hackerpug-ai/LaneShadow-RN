/**
 * PermissionNotification Component Story
 * Demonstrates permission request notification
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { View, Pressable, Text } from 'react-native'
import { PermissionNotification } from '../../components/ui/permission-notification'

const meta: Meta<typeof PermissionNotification> = {
  title: 'Components/PermissionNotification',
  component: PermissionNotification,
  parameters: {
    docs: {
      description: {
        component: 'Notification banner for permission requests with action button.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Notification title',
    },
    description: {
      control: 'text',
      description: 'Notification description text',
    },
    actionLabel: {
      control: 'text',
      description: 'Action button label',
    },
  },
  args: {
    title: 'Location Permission Required',
    description: 'Enable location access to find routes near you.',
    actionLabel: 'Enable',
  },
}

export default meta
type Story = StoryObj<typeof PermissionNotification>

export const Default: Story = {
  args: {
    title: 'Location Permission Required',
    description: 'Enable location access to find routes near you.',
    actionLabel: 'Enable',
  },
}

export const WithoutAction: Story = {
  args: {
    title: 'Notifications Disabled',
    description: 'Enable notifications to receive route updates.',
  },
}

export const PreventDismiss: Story = {
  args: {
    title: 'Permission Required',
    description: 'This feature requires camera permission to continue.',
    actionLabel: 'Allow',
    preventDismissOnTap: true,
  },
}

const InteractiveDemo = () => {
  const [granted, setGranted] = useState(false)
  if (granted) {
    return (
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => setGranted(false)}>
          <Text>Reset Permission</Text>
        </Pressable>
      </View>
    )
  }
  return (
    <PermissionNotification
      title="Camera Access"
      description="Allow access to camera to capture route photos"
      actionLabel="Grant Permission"
      onActionPress={() => setGranted(true)}
    />
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
}
