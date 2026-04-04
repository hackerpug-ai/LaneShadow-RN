import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { PlanningProgressIndicator } from '../../components/ui/planning-progress-indicator';

const meta: Meta<typeof PlanningProgressIndicator> = {
  title: 'Components/PlanningProgressIndicator',
  component: PlanningProgressIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Inline progress indicator showing agentic planning pipeline stages: Reading intent, Finding scenic roads, Checking weather, Building route options.',
      },
    },
  },
  argTypes: {
    currentStep: {
      control: {
        type: 'select',
      },
      options: ['reading', 'finding', 'weather', 'building', 'complete'],
      description: 'Current planning step',
    },
    visible: {
      control: 'boolean',
      description: 'Indicator visibility',
    },
  },
  args: {
    currentStep: 'reading',
    visible: true,
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
type Story = StoryObj<typeof PlanningProgressIndicator>;

export const Reading: Story = {
  args: {
    currentStep: 'reading',
  },
};

export const Finding: Story = {
  args: {
    currentStep: 'finding',
  },
};

export const CheckingWeather: Story = {
  args: {
    currentStep: 'weather',
  },
};

export const Building: Story = {
  args: {
    currentStep: 'building',
  },
};

export const Hidden: Story = {
  args: {
    currentStep: 'complete',
    visible: true,
  },
};

export const WithMapBackground: Story = {
  args: {
    currentStep: 'weather',
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
            }}
          />
        </View>
        <Story />
      </View>
    ),
  ],
};
