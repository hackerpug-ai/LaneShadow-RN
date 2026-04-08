import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { RouteAttachmentCard } from '../../components/ui/route-attachment-card';

const meta: Meta<typeof RouteAttachmentCard> = {
  title: 'Components/RouteAttachmentCard',
  component: RouteAttachmentCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact route card for chat attachments showing route label, description, stats, and weather badges. Supports selection state and compact variant.',
      },
    },
  },
  argTypes: {
    id: { control: 'text', description: 'Unique route identifier' },
    label: { control: 'text', description: 'Route name' },
    description: { control: 'text', description: 'Route description' },
    distance: { control: 'text', description: 'Route distance' },
    duration: { control: 'text', description: 'Estimated duration' },
    scenicScore: {
      control: 'number',
      description: 'Scenic score (0-10)',
    },
    weatherBadge: {
      control: 'object',
      description: 'Weather condition badge',
    },
    isBest: {
      control: 'boolean',
      description: 'Show "Best for today" badge',
    },
    isSelected: {
      control: 'boolean',
      description: 'Visual selection state',
    },
    variant: {
      control: 'select',
      options: ['compact', 'full'],
      description: 'Visual variant: compact for map overlay, full for chat transcript',
    },
    onPress: {
      action: 'pressed',
      description: 'Card press callback',
    },
  },
  args: {
    id: '1',
    label: 'Coastal Cruiser',
    description: 'Ocean views with light tailwinds',
    distance: '42 mi',
    duration: '2h 15m',
    scenicScore: 9.2,
    weatherBadge: {
      type: 'clear',
      text: 'Clear',
    },
    isBest: true,
    isSelected: false,
    variant: 'full',
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
type Story = StoryObj<typeof RouteAttachmentCard>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    isSelected: true,
  },
};

export const Rain: Story = {
  args: {
    label: 'Mountain Loop',
    description: 'Elevation gains, forest canopy',
    weatherBadge: {
      type: 'rain',
      text: 'Light rain 3 PM',
    },
    scenicScore: 8.7,
    isBest: false,
  },
};

export const Windy: Story = {
  args: {
    label: 'Valley Route',
    description: 'Farmland views, crosswind sections',
    weatherBadge: {
      type: 'wind',
      text: 'Windy 15-20 mph',
    },
    scenicScore: 8.1,
    isBest: false,
  },
};

export const Cloudy: Story = {
  args: {
    label: 'Hill Country',
    description: 'Rolling hills with overcast skies',
    weatherBadge: {
      type: 'cloudy',
      text: 'Partly cloudy',
    },
    scenicScore: 7.9,
    isBest: false,
  },
};

export const NoBadge: Story = {
  args: {
    weatherBadge: undefined,
    isBest: false,
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
  },
};

export const CompactSelected: Story = {
  args: {
    variant: 'compact',
    isSelected: true,
  },
};

export const Pressable: Story = {
  args: {
    onPress: () => console.log('Route card pressed'),
  },
};
