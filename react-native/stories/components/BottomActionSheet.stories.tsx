/**
 * BottomActionSheet Component Story
 * Demonstrates bottom action sheet modal
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { BottomActionSheet } from '../../components/ui/bottom-action-sheet'

const meta: Meta<typeof BottomActionSheet> = {
  title: 'Components/BottomActionSheet',
  component: BottomActionSheet,
  parameters: {
    docs: {
      description: {
        component: 'Low-level bottom sheet primitive using Gorhom. Provides modal, portal, and safe area handling.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Sheet visibility',
    },
    snapPoints: {
      control: 'object',
      description: 'Snap points for sheet height',
    },
  },
  args: {
    visible: false,
  },
}

export default meta
type Story = StoryObj<typeof BottomActionSheet>

const SampleContent = () => (
  <View style={{ padding: 24, gap: 16 }}>
    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Sheet Title</Text>
    <Text>This is the content of the bottom action sheet.</Text>
    <Text>You can put any React components here.</Text>
  </View>
)

const DefaultDemo = () => {
  const [visible, setVisible] = useState(false)
  return (
    <View style={{ padding: 16 }}>
       <Pressable onPress={() => setVisible(true)}><Text style={{ textDecorationLine: 'underline' }}>Show Sheet</Text></Pressable>
      <BottomActionSheet visible={visible} onDismiss={() => setVisible(false)}>
        <SampleContent />
      </BottomActionSheet>
    </View>
  )
}

export const Default: Story = {
  render: () => <DefaultDemo />,
}

const HalfHeightDemo = () => {
  const [visible, setVisible] = useState(false)
  return (
    <View style={{ padding: 16 }}>
       <Pressable onPress={() => setVisible(true)}><Text style={{ textDecorationLine: 'underline' }}>Show 50% Sheet</Text></Pressable>
      <BottomActionSheet visible={visible} onDismiss={() => setVisible(false)} snapPoints={['50%']}>
        <SampleContent />
      </BottomActionSheet>
    </View>
  )
}

export const HalfHeight: Story = {
  render: () => <HalfHeightDemo />,
}

const CustomSnapDemo = () => {
  const [visible, setVisible] = useState(false)
  return (
    <View style={{ padding: 16 }}>
       <Pressable onPress={() => setVisible(true)}><Text style={{ textDecorationLine: 'underline' }}>Show Custom Snap</Text></Pressable>
      <BottomActionSheet visible={visible} onDismiss={() => setVisible(false)} snapPoints={[300, '80%']}>
        <SampleContent />
      </BottomActionSheet>
    </View>
  )
}

export const CustomSnap: Story = {
  render: () => <CustomSnapDemo />,
}

const WithActionsDemo = () => {
  const [visible, setVisible] = useState(false)
  return (
    <View style={{ padding: 16 }}>
       <Pressable onPress={() => setVisible(true)}><Text style={{ textDecorationLine: 'underline' }}>Show Actions</Text></Pressable>
      <BottomActionSheet visible={visible} onDismiss={() => setVisible(false)}>
        <View style={{ padding: 24, gap: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Choose an action</Text>
          <View style={{ gap: 8 }}>
            <Pressable onPress={() => {}}><Text>Save</Text></Pressable>
            <Pressable onPress={() => {}}><Text>Cancel</Text></Pressable>
          </View>
        </View>
      </BottomActionSheet>
    </View>
  )
}

export const WithActions: Story = {
  render: () => <WithActionsDemo />,
}

const LongContentDemo = () => {
  const [visible, setVisible] = useState(false)
  return (
    <View style={{ padding: 16 }}>
       <Pressable onPress={() => setVisible(true)}><Text style={{ textDecorationLine: 'underline' }}>Show Long Content</Text></Pressable>
      <BottomActionSheet visible={visible} onDismiss={() => setVisible(false)}>
        <View style={{ padding: 24, gap: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Settings</Text>
          {Array.from({ length: 20 }).map((_, i) => (
            <Text key={i}>Setting option {i + 1}</Text>
          ))}
        </View>
      </BottomActionSheet>
    </View>
  )
}

export const LongContent: Story = {
  render: () => <LongContentDemo />,
}
