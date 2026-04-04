import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { FullChatHistoryView, ChatMessage } from '../../components/ui/full-chat-history-view';

const meta: Meta<typeof FullChatHistoryView> = {
  title: 'Components/FullChatHistoryView',
  component: FullChatHistoryView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Expanded chat history view showing all messages with route attachments. Takes 70% of screen height with map visible below (dimmed).',
      },
    },
  },
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'View visibility',
    },
    messages: {
      control: 'object',
      description: 'Array of chat messages',
    },
    onCollapse: {
      action: 'collapsed',
      description: 'Callback when view is collapsed',
    },
    onRoutePress: {
      action: 'route-pressed',
      description: 'Callback when a route attachment is pressed',
    },
  },
  args: {
    visible: true,
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#0E0F11' }}>
        <Story />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.3,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.55)' }}>
            Map View (Dimmed)
          </Text>
        </View>
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FullChatHistoryView>;

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

export const SingleMessage: Story = {
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
        content: 'Updated! Here are 2 shorter options...',
        timestamp: new Date(Date.now() - 60000),
        routeAttachments: [
          MOCK_MESSAGES[1].routeAttachments![1],
          MOCK_MESSAGES[1].routeAttachments![2],
        ],
      },
    ],
  },
};

export const WithPendingInput: Story = {
  args: {
    messages: MOCK_MESSAGES,
    currentInput: 'Add a stop at Big Sur',
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
