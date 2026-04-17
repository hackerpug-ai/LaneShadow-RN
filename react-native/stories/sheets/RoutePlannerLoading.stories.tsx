import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { RoutePlannerLoading } from '../../components/sheets/planning-loading'

// Overlay decorator to simulate full-screen loading presentation
const OverlayDecorator = (Story: React.ComponentType) => {
  return (
    <View style={styles.container}>
      <Story />
    </View>
  )
}

const meta: Meta<typeof RoutePlannerLoading> = {
  title: 'Sheets/RoutePlannerLoading',
  component: RoutePlannerLoading,
  parameters: {
    docs: {
      description: {
        component: 'Full-screen overlay loading component shown during route planning. Displays activity indicator, progress message, and cancel button. Uses scrim backdrop for focus.',
      },
    },
    layout: 'fullscreen',
  },
  decorators: [OverlayDecorator],
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Controls overlay visibility',
    },
  },
  args: {
    isVisible: true,
    onCancel: () => {},
  },
}

export default meta
type Story = StoryObj<typeof RoutePlannerLoading>

export const Default: Story = {}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
})
