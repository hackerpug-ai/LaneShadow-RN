import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { SessionCard } from '../../components/ui/session-card';

const meta: Meta<typeof SessionCard> = {
  title: 'Components/SessionCard',
  component: SessionCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Session summary card for sidebar showing title, route count, status, and message preview. Supports compact variant and press/long-press actions.',
      },
    },
  },
  argTypes: {
    id: { control: 'text', description: 'Session ID' },
    title: { control: 'text', description: 'Session title' },
    date: { control: 'date', description: 'Session date' },
    routeCount: {
      control: 'number',
      description: 'Number of routes in session',
    },
    status: {
      control: {
        type: 'select',
      },
      options: ['active', 'completed', 'saved'],
      description: 'Session status',
    },
    previewMessage: {
      control: 'text',
      description: 'Preview of first message',
    },
    isActive: {
      control: 'boolean',
      description: 'Visual selection state',
    },
    compact: {
      control: 'boolean',
      description: 'Use compact layout',
    },
    onPress: {
      action: 'pressed',
      description: 'Card press callback',
    },
    onLongPress: {
      action: 'long-pressed',
      description: 'Long press callback',
    },
  },
  args: {
    id: '1',
    title: 'Coastal Loop',
    date: new Date(),
    routeCount: 2,
    status: 'active',
    previewMessage: '2-hour coastal ride, light hills',
    isActive: false,
    compact: false,
  },
  decorators: [
    (Story) => (
      <View style={{ width: 350, backgroundColor: '#0E0F11', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SessionCard>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    isActive: true,
  },
};

export const Completed: Story = {
  args: {
    status: 'completed',
    title: 'Mountain Run',
    previewMessage: 'Elevation gains please',
    date: new Date(Date.now() - 3600000),
  },
};

export const Saved: Story = {
  args: {
    status: 'saved',
    title: 'Valley Route',
    previewMessage: 'Farmland views with twisties',
    date: new Date(Date.now() - 86400000),
  },
};

export const Compact: Story = {
  args: {
    compact: true,
  },
};

export const CompactActive: Story = {
  args: {
    compact: true,
    isActive: true,
  },
};

export const ManyRoutes: Story = {
  args: {
    routeCount: 5,
    previewMessage: 'Epic all-day adventure covering multiple mountain passes',
  },
};

export const Pressable: Story = {
  args: {
    onPress: () => console.log('Session pressed'),
    onLongPress: () => console.log('Session long-pressed'),
  },
};
