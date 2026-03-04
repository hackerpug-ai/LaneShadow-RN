import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { PlanningErrorSheet } from '../../components/sheets/planning-error-sheet'

// Sheet wrapper decorator to simulate bottom sheet presentation
const SheetDecorator = (Story: React.ComponentType) => {
  return (
    <View style={styles.sheetContainer}>
      <View style={styles.backdrop} />
      <View style={styles.sheetWrapper}>
        <View style={styles.sheetHandle} />
        <Story />
      </View>
    </View>
  )
}

const meta: Meta<typeof PlanningErrorSheet> = {
  title: 'Sheets/PlanningErrorSheet',
  component: PlanningErrorSheet,
  parameters: {
    docs: {
      description: {
        component: 'Content-height bottom sheet for displaying planning errors with try again and back actions. Shows when route planning fails due to network issues or invalid inputs.',
      },
    },
    layout: 'fullscreen',
  },
  decorators: [SheetDecorator],
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Controls sheet visibility',
    },
    message: {
      control: 'text',
      description: 'Error message to display',
    },
  },
  args: {
    isVisible: true,
    message: 'Unable to calculate route. Please check your connection and try again.',
    onTryAgain: () => {},
    onBack: () => {},
    onClose: () => {},
  },
}

export default meta
type Story = StoryObj<typeof PlanningErrorSheet>

export const Default: Story = {}

export const NetworkError: Story = {
  args: {
    message: 'Network request failed. Please check your internet connection and try again.',
  },
}

export const InvalidLocation: Story = {
  args: {
    message: 'Could not find the specified location. Please enter a valid city or address.',
  },
}

export const ServiceUnavailable: Story = {
  args: {
    message: 'Routing service is temporarily unavailable. Please try again later.',
  },
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '60%',
    backgroundColor: '#1A1C1F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
})
