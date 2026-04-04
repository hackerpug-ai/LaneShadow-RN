import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { SessionSidebar, ChatSession } from '../../components/ui/session-sidebar';

const meta: Meta<typeof SessionSidebar> = {
  title: 'Components/SessionSidebar',
  component: SessionSidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Slide-out sidebar showing chat session history. Groups sessions by Today, Yesterday, and Older. Supports new session creation and session resumption.',
      },
    },
  },
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Sidebar visibility',
    },
    sessions: {
      control: 'object',
      description: 'Array of chat sessions',
    },
    activeSessionId: {
      control: 'text',
      description: 'Currently active session ID',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when sidebar is closed',
    },
    onSessionPress: {
      action: 'session-pressed',
      description: 'Callback when a session is pressed',
    },
    onNewSession: {
      action: 'new-session',
      description: 'Callback when new session button is pressed',
    },
  },
  args: {
    visible: true,
    activeSessionId: '1',
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#0E0F11' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.55)' }}>
            Map View (Dimmed)
          </Text>
        </View>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SessionSidebar>;

const TODAY_SESSIONS: ChatSession[] = [
  {
    id: '1',
    title: 'Coastal Loop',
    date: new Date(),
    routeCount: 2,
    status: 'active',
    previewMessage: '2-hour coastal ride, light hills',
  },
  {
    id: '2',
    title: 'Mountain Climber',
    date: new Date(Date.now() - 3600000),
    routeCount: 3,
    status: 'completed',
    previewMessage: 'Elevation gains please',
  },
];

const YESTERDAY_SESSIONS: ChatSession[] = [
  {
    id: '3',
    title: 'Valley Run',
    date: new Date(Date.now() - 86400000),
    routeCount: 2,
    status: 'saved',
    previewMessage: 'Farmland views with twisties',
  },
];

const ALL_SESSIONS = [...TODAY_SESSIONS, ...YESTERDAY_SESSIONS];

export const Default: Story = {
  args: {
    sessions: ALL_SESSIONS,
  },
};

export const Empty: Story = {
  args: {
    sessions: [],
    activeSessionId: undefined,
  },
};

export const ManySessions: Story = {
  args: {
    sessions: [
      ...ALL_SESSIONS,
      {
        id: '4',
        title: 'Coastal Highway Run',
        date: new Date(Date.now() - 172800000),
        routeCount: 1,
        status: 'saved',
        previewMessage: 'PCH all the way',
      },
      {
        id: '5',
        title: 'Desert Explorer',
        date: new Date(Date.now() - 259200000),
        routeCount: 2,
        status: 'completed',
        previewMessage: 'Hot and scenic',
      },
    ],
    activeSessionId: undefined,
  },
};

export const SingleSession: Story = {
  args: {
    sessions: [TODAY_SESSIONS[0]],
  },
};
