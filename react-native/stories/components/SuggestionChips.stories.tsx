import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { SuggestionChips, SuggestionChip } from '../../components/ui/suggestion-chips';

const meta: Meta<typeof SuggestionChips> = {
  title: 'Components/SuggestionChips',
  component: SuggestionChips,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Quick-start suggestion chips for common ride types. Horizontal scrolling or wrap layout options.',
      },
    },
  },
  argTypes: {
    suggestions: {
      control: 'object',
      description: 'Array of suggestion chips to display',
    },
    onPress: {
      action: 'pressed',
      description: 'Callback when a chip is pressed',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all chips',
    },
    horizontal: {
      control: 'boolean',
      description: 'Enable horizontal scrolling instead of wrap',
    },
  },
  args: {
    disabled: false,
    horizontal: false,
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
type Story = StoryObj<typeof SuggestionChips>;

const DEFAULT_SUGGESTIONS: SuggestionChip[] = [
  { id: '1', label: '2-hour loop', icon: '🌟' },
  { id: '2', label: 'scenic coastal', icon: '🌊' },
  { id: '3', label: 'avoid highways', icon: '🛣️' },
];

export const Default: Story = {
  args: {
    suggestions: DEFAULT_SUGGESTIONS,
  },
};

export const Horizontal: Story = {
  args: {
    suggestions: DEFAULT_SUGGESTIONS,
    horizontal: true,
  },
};

export const ManyChips: Story = {
  args: {
    suggestions: [
      { id: '1', label: '2-hour loop', icon: '🌟' },
      { id: '2', label: 'scenic coastal', icon: '🌊' },
      { id: '3', label: 'avoid highways', icon: '🛣️' },
      { id: '4', label: 'mountain twisties', icon: '⛰️' },
      { id: '5', label: 'no traffic', icon: '🚗' },
      { id: '6', label: 'short ride', icon: '⏱️' },
    ],
    horizontal: true,
  },
};

export const WithoutIcons: Story = {
  args: {
    suggestions: [
      { id: '1', label: '2-hour loop' },
      { id: '2', label: 'scenic coastal' },
      { id: '3', label: 'avoid highways' },
    ],
  },
};

export const Disabled: Story = {
  args: {
    suggestions: DEFAULT_SUGGESTIONS,
    disabled: true,
  },
};
