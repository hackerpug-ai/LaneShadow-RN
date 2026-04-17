import type { Meta, StoryObj } from '@storybook/react-native'
import { View } from 'react-native'
import { MinimalOverlayWidget } from '../../components/map/minimal-overlay-widget'
import { MinimalOverlayWidgetPreview } from '../../components/map/minimal-overlay-widget-preview'

const meta: Meta<typeof MinimalOverlayWidget> = {
  title: 'Map/MinimalOverlayWidget',
  component: MinimalOverlayWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A compact, single-icon weather overlay control that expands into a radial menu. Inspired by motorcycle instrument dials and compass navigation.\n\n**States:**\n- **Collapsed**: Single icon showing active overlay (or stack icon when none)\n- **Expanded**: Three icons arc outward (wind, rain, temp)\n- **Selected**: Active overlay glows with copper accent\n\n**Interaction:**\n- Tap center icon to expand/collapse\n- Tap overlay icon to select (tap again to deselect)\n- Disabled icons show when data unavailable',
      },
    },
  },
  argTypes: {
    value: {
      control: 'select',
      options: ['', 'wind', 'rain', 'temperature'],
      description: 'Currently selected overlay',
    },
    onValueChange: {
      action: 'onValueChange',
      description: 'Callback when selection changes',
    },
    availability: {
      control: 'object',
      description: 'Data availability for each overlay type',
    },
  },
  args: {
    value: '',
    availability: {
      wind: true,
      rain: true,
      temperature: true,
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: '100%', height: '100%', backgroundColor: '#1B1715', alignItems: 'center', justifyContent: 'center' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MinimalOverlayWidget>

// Interactive preview with all scenarios
export const InteractivePreview = () => <MinimalOverlayWidgetPreview />

// Basic states
export const Collapsed: Story = {
  args: {
    value: '',
    availability: { wind: true, rain: true, temperature: true },
  },
}

export const WindSelected: Story = {
  args: {
    value: 'wind',
    availability: { wind: true, rain: true, temperature: true },
  },
}

export const RainSelected: Story = {
  args: {
    value: 'rain',
    availability: { wind: true, rain: true, temperature: true },
  },
}

export const TempSelected: Story = {
  args: {
    value: 'temperature',
    availability: { wind: true, rain: true, temperature: true },
  },
}

// Availability scenarios
export const WindOnly: Story = {
  args: {
    value: '',
    availability: { wind: true, rain: false, temperature: false },
  },
}

export const RainAndTemp: Story = {
  args: {
    value: 'rain',
    availability: { wind: false, rain: true, temperature: true },
  },
}

export const NoneAvailable: Story = {
  args: {
    value: '',
    availability: { wind: false, rain: false, temperature: false },
  },
}

// Expanded state simulation (for documentation)
export const ExpandedState: Story = {
  args: {
    value: '',
    availability: { wind: true, rain: true, temperature: true },
  },
  parameters: {
    docs: {
      description: {
        story: 'Press the center icon to see the radial expansion animation.',
      },
    },
  },
}
