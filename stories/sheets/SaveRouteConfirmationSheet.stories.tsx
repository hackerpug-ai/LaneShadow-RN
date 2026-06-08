import type { Meta, StoryObj } from '@storybook/react'
import { SaveRouteConfirmationSheet } from '../../components/sheets/save-route-confirmation-sheet'

const meta: Meta<typeof SaveRouteConfirmationSheet> = {
  title: 'Sheets/SaveRouteConfirmationSheet',
  component: SaveRouteConfirmationSheet,
  parameters: {
    docs: {
      description: {
        component:
          'Confirmation sheet for saving a route with a custom name. Displays an input field for route naming with cancel and confirm actions.',
      },
    },
  },
  argTypes: {
    isVisible: {
      control: { type: 'boolean' },
      description: 'Controls whether the sheet is visible',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback fired when the sheet is closed',
    },
    onConfirm: {
      action: 'onConfirm',
      description: 'Callback fired when the user confirms the save with route name',
    },
    defaultName: {
      control: { type: 'text' },
      description: 'Default name to pre-fill in the input field',
    },
    isSaving: {
      control: { type: 'boolean' },
      description: 'Shows loading state and disables interactions during save operation',
    },
    testID: {
      control: { type: 'text' },
      description: 'Test ID for testing purposes',
    },
  },
  args: {
    isVisible: true,
    defaultName: '',
    isSaving: false,
    testID: 'save-route-confirmation-sheet',
  },
}

export default meta
type Story = StoryObj<typeof SaveRouteConfirmationSheet>

export const Default: Story = {
  args: {
    defaultName: '',
  },
}

export const WithDefaultName: Story = {
  args: {
    defaultName: 'Coastal Sunday Ride',
  },
}

export const Saving: Story = {
  args: {
    isSaving: true,
    defaultName: 'Mountain Loop Trail',
  },
}

export const Hidden: Story = {
  args: {
    isVisible: false,
  },
}
