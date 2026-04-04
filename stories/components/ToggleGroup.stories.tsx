/**
 * ToggleGroup Component Story
 * Demonstrates group of toggle buttons with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View } from 'react-native'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'

const meta: Meta<typeof ToggleGroup> = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    docs: {
      description: {
        component: 'Group of toggle buttons with semantic theme styling. Supports single and multiple selection modes.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Selection mode',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
  args: {
    type: 'single',
    variant: 'default',
    size: 'default',
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof ToggleGroup>

const SingleSelectionDemo = () => {
  const [value, setValue] = useState('left')
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => setValue(v as string)}>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const SingleSelection: Story = {
  render: () => <SingleSelectionDemo />,
}

const MultipleSelectionDemo = () => {
  const [value, setValue] = useState<string[]>(['bold'])
  return (
    <ToggleGroup type="multiple" value={value} onValueChange={(v) => setValue(v as string[])}>
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const MultipleSelection: Story = {
  render: () => <MultipleSelectionDemo />,
}

const OutlineDemo = () => {
  const [value, setValue] = useState('day')
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => setValue(v as string)} variant="outline">
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const Outline: Story = {
  render: () => <OutlineDemo />,
}

const SmallDemo = () => {
  const [value, setValue] = useState('sm')
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => setValue(v as string)} size="sm">
      <ToggleGroupItem value="sm">Small</ToggleGroupItem>
      <ToggleGroupItem value="md">Medium</ToggleGroupItem>
      <ToggleGroupItem value="lg">Large</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const Small: Story = {
  render: () => <SmallDemo />,
}

const LargeDemo = () => {
  const [value, setValue] = useState('grid')
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => setValue(v as string)} size="lg">
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const Large: Story = {
  render: () => <LargeDemo />,
}

const WithIconsDemo = () => {
  const [value, setValue] = useState('list')
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => setValue(v as string)}>
      <ToggleGroupItem value="list">List View</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid View</ToggleGroupItem>
      <ToggleGroupItem value="map">Map View</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const WithIcons: Story = {
  render: () => <WithIconsDemo />,
}

const RouteTypesDemo = () => {
  const [value, setValue] = useState<string[]>(['scenic'])
  return (
    <ToggleGroup type="multiple" value={value} onValueChange={(v) => setValue(v as string[])}>
      <ToggleGroupItem value="scenic">Scenic</ToggleGroupItem>
      <ToggleGroupItem value="paved">Paved</ToggleGroupItem>
      <ToggleGroupItem value="flat">Flat</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const RouteTypes: Story = {
  render: () => <RouteTypesDemo />,
}
