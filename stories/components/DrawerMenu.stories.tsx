/**
 * DrawerMenu Component Story
 * Demonstrates slide-out drawer menu with navigation items
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { DrawerMenu } from '../../components/ui/drawer-menu'
import type { IconName } from '../../components/ui/icon-symbol'

const meta: Meta<typeof DrawerMenu> = {
  title: 'Components/DrawerMenu',
  component: DrawerMenu,
  parameters: {
    docs: {
      description: {
        component: 'Slide-out drawer menu that pushes content to the right. Supports sections and footer.',
      },
    },
    layout: 'centered',
  },
  args: {
    isOpen: false,
  },
}

export default meta
type Story = StoryObj<typeof DrawerMenu>

const sampleSections = [
  {
    title: 'Navigation',
    items: [
      { label: 'Home', icon: 'home' as IconName, onPress: () => {}, active: true },
      { label: 'Routes', icon: 'map' as IconName, onPress: () => {} },
      { label: 'Saved', icon: 'heart' as IconName, onPress: () => {} },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Profile', icon: 'account' as IconName, onPress: () => {} },
      { label: 'Preferences', icon: 'cog' as IconName, onPress: () => {} },
    ],
  },
]

const sampleFooter = {
  items: [
    { label: 'Log Out', icon: 'logout' as IconName, onPress: () => {} },
  ],
}

export const Closed: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View style={{ width: '100%', height: 400, position: 'relative' }}>
        <Pressable onPress={() => setIsOpen(true)}><Text style={{ textDecorationLine: 'underline' }}>Open Drawer</Text></Pressable>
        <DrawerMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          header={{ title: 'Menu' }}
          sections={sampleSections}
          footer={sampleFooter}
        />
      </View>
    )
  },
}

export const Open: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true)
    return (
      <View style={{ width: '100%', height: 400, position: 'relative' }}>
        <Text style={{ padding: 16 }}>Content behind drawer</Text>
        <DrawerMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          header={{ title: 'Menu' }}
          sections={sampleSections}
          footer={sampleFooter}
        />
      </View>
    )
  },
}

export const WithoutHeader: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View style={{ width: '100%', height: 400, position: 'relative' }}>
        <Pressable onPress={() => setIsOpen(true)}><Text style={{ textDecorationLine: 'underline' }}>Open Drawer</Text></Pressable>
        <DrawerMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          sections={sampleSections}
          footer={sampleFooter}
        />
      </View>
    )
  },
}

export const WithoutFooter: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View style={{ width: '100%', height: 400, position: 'relative' }}>
        <Pressable onPress={() => setIsOpen(true)}><Text style={{ textDecorationLine: 'underline' }}>Open Drawer</Text></Pressable>
        <DrawerMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          header={{ title: 'Menu' }}
          sections={sampleSections}
        />
      </View>
    )
  },
}

export const SingleSection: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View style={{ width: '100%', height: 400, position: 'relative' }}>
        <Pressable onPress={() => setIsOpen(true)}><Text style={{ textDecorationLine: 'underline' }}>Open Drawer</Text></Pressable>
        <DrawerMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          sections={[
            {
              items: [
                { label: 'Home', icon: 'home', onPress: () => {} },
                { label: 'Search', icon: 'magnify', onPress: () => {} },
                { label: 'Profile', icon: 'account', onPress: () => {} },
              ],
            },
          ]}
        />
      </View>
    )
  },
}
