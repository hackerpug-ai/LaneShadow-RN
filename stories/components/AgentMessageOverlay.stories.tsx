import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { AgentMessageOverlay, RouteAttachment } from '../../components/ui/agent-message-overlay';

const meta: Meta<typeof AgentMessageOverlay> = {
  title: 'Components/AgentMessageOverlay',
  component: AgentMessageOverlay,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Temporary overlay card for agent responses on the map. Shows route attachments with weather badges, auto-dismisses after 5 seconds unless pinned.',
      },
    },
  },
  argTypes: {
    message: {
      control: 'text',
      description: 'Agent response message',
    },
    routeAttachments: {
      control: 'object',
      description: 'Route attachment cards to display',
    },
    visible: {
      control: 'boolean',
      description: 'Overlay visibility',
    },
    onDismiss: {
      action: 'dismissed',
      description: 'Callback when overlay is dismissed',
    },
    onMinimize: {
      action: 'minimized',
      description: 'Callback when overlay is minimized',
    },
    onRoutePress: {
      action: 'route-pressed',
      description: 'Callback when a route attachment is pressed',
    },
    autoDismiss: {
      control: 'boolean',
      description: 'Auto-dismiss after delay',
    },
    autoDismissDelay: {
      control: 'number',
      description: 'Auto-dismiss delay in milliseconds',
    },
  },
  args: {
    message: 'I found 3 great scenic routes for your ride! Each offers unique views and conditions.',
    visible: true,
    autoDismiss: false,
    autoDismissDelay: 5000,
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#0E0F11' }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.3,
          }}
        >
          <View
            style={{
              width: '80%',
              height: 2,
              backgroundColor: '#B87333',
              marginBottom: 40,
            }}
          />
          <View
            style={{
              width: '80%',
              height: 2,
              backgroundColor: '#4CAF50',
              marginBottom: 40,
            }}
          />
          <View
            style={{
              width: '80%',
              height: 2,
              backgroundColor: '#FF9800',
            }}
          />
        </View>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgentMessageOverlay>;

const MOCK_ROUTES: RouteAttachment[] = [
  {
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
  },
  {
    id: '2',
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
    id: '3',
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
];

export const Default: Story = {
  args: {
    routeAttachments: MOCK_ROUTES,
  },
};

export const SingleRoute: Story = {
  args: {
    message: 'Here is the best route for your ride today!',
    routeAttachments: [MOCK_ROUTES[0]],
  },
};

export const NoRoutes: Story = {
  args: {
    message: 'I need a bit more detail — where are you starting from?',
    routeAttachments: [],
  },
};

export const CloudyConditions: Story = {
  args: {
    message: 'Found 2 routes with partly cloudy conditions.',
    routeAttachments: [
      {
        id: '1',
        label: 'Valley Run',
        description: 'Scenic farmland with light clouds',
        distance: '28 mi',
        duration: '1h 45m',
        scenicScore: 8.5,
        weatherBadge: {
          type: 'cloudy',
          text: 'Partly cloudy',
        },
        isBest: true,
      },
      {
        id: '2',
        label: 'Hill Country',
        description: 'Rolling hills with overcast skies',
        distance: '32 mi',
        duration: '2h 10m',
        scenicScore: 7.9,
        weatherBadge: {
          type: 'cloudy',
          text: 'Overcast',
        },
      },
    ],
  },
};

export const LongMessage: Story = {
  args: {
    message:
      'I found several great options for your coastal ride! The first route offers the best weather conditions today with clear skies and light winds. The second option has some scenic mountain views but there is a chance of light rain around 3 PM. The third route is the shortest but will be quite windy in the open valley sections. All routes offer excellent scenery!',
    routeAttachments: MOCK_ROUTES,
  },
};
