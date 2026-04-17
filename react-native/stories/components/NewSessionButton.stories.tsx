import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { NewSessionButton } from '../../components/ui/new-session-button';

const meta: Meta<typeof NewSessionButton> = {
  title: 'Components/NewSessionButton',
  component: NewSessionButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'New session button with three variants: header (inline with icon), fab (floating action button), and text (link style). Supports multiple sizes.',
      },
    },
  },
  argTypes: {
    onPress: {
      action: 'pressed',
      description: 'Button press callback',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    variant: {
      control: {
        type: 'select',
      },
      options: ['header', 'fab', 'text'],
      description: 'Button variant style',
    },
    label: {
      control: 'text',
      description: 'Button label text',
    },
    size: {
      control: {
        type: 'select',
      },
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
  },
  args: {
    disabled: false,
    variant: 'header',
    label: 'Session',
    size: 'md',
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
type Story = StoryObj<typeof NewSessionButton>;

export const Header: Story = {
  args: {
    variant: 'header',
  },
};

export const HeaderSmall: Story = {
  args: {
    variant: 'header',
    size: 'sm',
  },
};

export const HeaderLarge: Story = {
  args: {
    variant: 'header',
    size: 'lg',
  },
};

export const FAB: Story = {
  args: {
    variant: 'fab',
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#0E0F11' }}>
        <Story />
      </View>
    ),
  ],
};

export const FABSmall: Story = {
  args: {
    variant: 'fab',
    size: 'sm',
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#0E0F11' }}>
        <Story />
      </View>
    ),
  ],
};

export const TextVariant: Story = {
  args: {
    variant: 'text',
    label: 'New Session',
  },
};

export const TextSmall: Story = {
  args: {
    variant: 'text',
    size: 'sm',
  },
};

export const CustomLabel: Story = {
  args: {
    variant: 'header',
    label: 'New Chat',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
