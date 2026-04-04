import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { ChatInputBar } from '../../components/ui/chat-input-bar';

const meta: Meta<typeof ChatInputBar> = {
  title: 'Components/ChatInputBar',
  component: ChatInputBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Primary chat input bar for agentic conversational planning. Always-visible at bottom of map screen with suggestion chips, location context, and session management actions.',
      },
    },
  },
  argTypes: {
    onSend: {
      action: 'send',
      description: 'Callback when user sends a message',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for input',
    },
    locationContext: {
      control: 'text',
      description: 'User location to display',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum message length',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable input (e.g., during route generation)',
    },
    showSuggestions: {
      control: 'boolean',
      description: 'Show suggestion chips when input is empty',
    },
    suggestions: {
      control: 'object',
      description: 'Custom suggestion chips',
    },
  },
  args: {
    placeholder: 'Describe your ride...',
    locationContext: 'Near Asheville, NC',
    maxLength: 500,
    disabled: false,
    showSuggestions: true,
  },
  decorators: [
    (Story) => (
      <View style={{ width: '100%', height: '100%', backgroundColor: '#0E0F11' }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatInputBar>;

export const Default: Story = {
  args: {},
};

export const WithMessage: Story = {
  args: {
    placeholder: 'Make it shorter, avoid Highway 1...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithoutSuggestions: Story = {
  args: {
    showSuggestions: false,
  },
};

export const CustomSuggestions: Story = {
  args: {
    suggestions: [
      { id: '1', label: 'Mountain twisties', icon: 'trail-sign-outline' as const },
      { id: '2', label: 'Coastal views', icon: 'water-outline' as const },
      { id: '3', label: 'No traffic', icon: 'car-outline' as const },
    ],
  },
};

export const FullActions: Story = {
  args: {
    onManualModePress: () => console.log('Manual mode pressed'),
    onNewSessionPress: () => console.log('New session pressed'),
  },
};
