import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { ChatTranscript, ChatMessage } from '../../components/ui/chat-transcript';

const meta: Meta<typeof ChatTranscript> = {
  title: 'Components/ChatTranscript',
  component: ChatTranscript,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Agentic chat transcript view. Rider messages are right-aligned bubbles; agent messages are left-aligned with a motorbike avatar. Route attachments render inline below agent text.',
      },
    },
  },
  argTypes: {
    messages: {
      control: 'object',
      description: 'Array of chat messages',
    },
    onRoutePress: {
      action: 'route-pressed',
      description: 'Callback when a route attachment is pressed',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatTranscript>;

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'rider',
    content: '2-hour coastal ride, light hills',
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: '2',
    role: 'agent',
    content: 'I found 3 great scenic routes for your ride! Each offers unique views and conditions.',
    timestamp: new Date(Date.now() - 60000),
    routeAttachments: [
      {
        id: 'r1',
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
      },
      {
        id: 'r2',
        label: 'Mountain Loop',
        description: 'Elevation gains, forest canopy',
        distance: '38 mi',
        duration: '2h 05m',
        scenicScore: 8.7,
        weatherBadge: {
          type: 'rain',
          text: 'Light rain 3 PM',
        },
      },
      {
        id: 'r3',
        label: 'Valley Route',
        description: 'Farmland views, crosswind sections',
        distance: '35 mi',
        duration: '1h 50m',
        scenicScore: 8.1,
        weatherBadge: {
          type: 'wind',
          text: 'Windy 15-20 mph',
        },
      },
    ],
  },
];

export const Default: Story = {
  args: {
    messages: MOCK_MESSAGES,
  },
};

export const SingleRiderMessage: Story = {
  args: {
    messages: [
      {
        id: '1',
        role: 'rider',
        content: 'Show me some twisty roads',
        timestamp: new Date(),
      },
    ],
  },
};

export const EmptyState: Story = {
  args: {
    messages: [],
  },
};

export const LongConversation: Story = {
  args: {
    messages: [
      {
        id: '1',
        role: 'rider',
        content: '2-hour coastal ride',
        timestamp: new Date(Date.now() - 300000),
      },
      {
        id: '2',
        role: 'agent',
        content: 'Found some great options! Here are 3 routes...',
        timestamp: new Date(Date.now() - 240000),
        routeAttachments: [MOCK_MESSAGES[1].routeAttachments![0]],
      },
      {
        id: '3',
        role: 'rider',
        content: 'Make it shorter, under 2 hours',
        timestamp: new Date(Date.now() - 120000),
      },
      {
        id: '4',
        role: 'agent',
        content: 'Updated! Here are 2 shorter options that come in under your 2-hour window.',
        timestamp: new Date(Date.now() - 60000),
        routeAttachments: [
          MOCK_MESSAGES[1].routeAttachments![1],
          MOCK_MESSAGES[1].routeAttachments![2],
        ],
      },
    ],
  },
};

export const ErrorRecovery: Story = {
  args: {
    messages: [
      {
        id: '1',
        role: 'rider',
        content: 'Ride to somewhere',
        timestamp: new Date(Date.now() - 60000),
      },
      {
        id: '2',
        role: 'agent',
        content:
          'I need a bit more detail — where are you starting from? Try including your starting location or a specific destination.',
        timestamp: new Date(),
      },
    ],
  },
};
