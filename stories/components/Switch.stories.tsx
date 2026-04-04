/**
 * Switch Component Story
 * Demonstrates toggle switch with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { Switch } from '../../components/ui/switch'

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    docs: {
      description: {
        component: 'Toggle switch with animated thumb and semantic theme styling.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'boolean',
      description: 'Switch state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
  args: {
    value: false,
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Off: Story = {
  args: {
    value: false,
  },
}

export const On: Story = {
  args: {
    value: true,
  },
}

export const Disabled: Story = {
  args: {
    value: false,
    disabled: true,
  },
}

export const DisabledOn: Story = {
  args: {
    value: true,
    disabled: true,
  },
}

const InteractiveDemo = () => {
  const [enabled, setEnabled] = useState(false)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Switch value={enabled} onValueChange={setEnabled} />
      <Text>{enabled ? 'Enabled' : 'Disabled'}</Text>
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
}

const SettingsDemo = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    location: false,
    darkMode: true,
  })
  return (
    <View style={{ gap: 16, width: 280 }}>
      {[
        { key: 'notifications', label: 'Push Notifications' },
        { key: 'location', label: 'Location Services' },
        { key: 'darkMode', label: 'Dark Mode' },
      ].map((setting) => (
        <View key={setting.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text>{setting.label}</Text>
          <Switch
            value={settings[setting.key as keyof typeof settings]}
            onValueChange={(value) => setSettings({ ...settings, [setting.key]: value })}
          />
        </View>
      ))}
    </View>
  )
}

export const Settings: Story = {
  render: () => <SettingsDemo />,
}
