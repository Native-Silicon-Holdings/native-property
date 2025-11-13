import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the input',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'The type of input',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
    },
    required: {
      control: 'boolean',
      description: 'Marks the input as required',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes the input full width',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
  },
};

export const WithHelpText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    helpText: 'Password must be at least 12 characters long',
    placeholder: 'Enter your password',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    error: 'Please enter a valid email address',
    placeholder: 'you@example.com',
    defaultValue: 'invalid-email',
  },
};

export const Required: Story = {
  args: {
    label: 'Username',
    required: true,
    placeholder: 'Enter username',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    disabled: true,
    placeholder: 'This input is disabled',
    defaultValue: 'Cannot edit this',
  },
};

export const Small: Story = {
  args: {
    label: 'Small Input',
    size: 'sm',
    placeholder: 'Small size',
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium Input',
    size: 'md',
    placeholder: 'Medium size (default)',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    size: 'lg',
    placeholder: 'Large size',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width Input',
    fullWidth: true,
    placeholder: 'This input takes full width',
  },
  parameters: {
    layout: 'padded',
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Property Number',
    type: 'number',
    placeholder: '123',
    min: 1,
    max: 1000,
  },
};

export const TelephoneInput: Story = {
  args: {
    label: 'Phone Number',
    type: 'tel',
    placeholder: '+1 (555) 123-4567',
    helpText: 'Enter your contact number',
  },
};

// Form Example
export const LoginForm: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        fullWidth
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        fullWidth
        required
        helpText="Must be at least 12 characters"
      />
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};

// All Sizes Example
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input label="Small" size="sm" placeholder="Small input" />
      <Input label="Medium" size="md" placeholder="Medium input" />
      <Input label="Large" size="lg" placeholder="Large input" />
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};

// All States Example
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input label="Normal" placeholder="Normal state" />
      <Input
        label="With Help Text"
        placeholder="Has help text"
        helpText="This is helpful information"
      />
      <Input
        label="With Error"
        placeholder="Has error"
        error="This field has an error"
        defaultValue="Invalid input"
      />
      <Input
        label="Disabled"
        placeholder="Disabled state"
        disabled
        defaultValue="Cannot edit"
      />
      <Input
        label="Required"
        placeholder="Required field"
        required
      />
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};
