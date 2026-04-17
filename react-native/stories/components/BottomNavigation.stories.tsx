/**
 * BottomNavigation Component Story
 * Demonstrates 4-tab bottom navigation bar
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { BottomNavigation, NavItem } from '../../components/ui/bottom-navigation'

const meta: Meta<typeof BottomNavigation> = {
  title: 'Components/BottomNavigation',
  component: BottomNavigation,
  parameters: {
    docs: {
      description: {
        component: 'Bottom tab navigation with 4 tabs (Explore, Saved, Rides, Profile). Follows Material Design 3 patterns.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of navigation items with icon, label, and active state',
    },
    backgroundColor: {
      control: 'color',
      description: 'Background color override',
    },
  },
}

export default meta
type Story = StoryObj<typeof BottomNavigation>

const defaultItems: NavItem[] = [
  { icon: 'map', label: 'Explore', active: false },
  { icon: 'bookmark', label: 'Saved', active: false },
  { icon: 'motorbike', label: 'Rides', active: false },
  { icon: 'account', label: 'Profile', active: false },
]

export const Default: Story = {
  args: {
    items: defaultItems,
  },
}

export const SavedActive: Story = {
  args: {
    items: [
      { icon: 'map', label: 'Explore', active: false },
      { icon: 'bookmark', label: 'Saved', active: true },
      { icon: 'motorbike', label: 'Rides', active: false },
      { icon: 'account', label: 'Profile', active: false },
    ],
  },
}

export const RidesActive: Story = {
  args: {
    items: [
      { icon: 'map', label: 'Explore', active: false },
      { icon: 'bookmark', label: 'Saved', active: false },
      { icon: 'motorbike', label: 'Rides', active: true },
      { icon: 'account', label: 'Profile', active: false },
    ],
  },
}
