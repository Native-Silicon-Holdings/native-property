import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Badge } from './Badge';
import { Check, AlertCircle, Info, X as XIcon, Star, User } from 'lucide-react';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'gray'],
      description: 'The color variant of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the badge',
    },
    removable: {
      control: 'boolean',
      description: 'Shows a remove button',
    },
    rounded: {
      control: 'boolean',
      description: 'Pill-shaped vs rounded corners',
    },
  },
  args: { onRemove: fn() },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
};

export const Gray: Story = {
  args: {
    variant: 'gray',
    children: 'Gray',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Badge',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Badge',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Badge',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'success',
    icon: <Check />,
    children: 'Verified',
  },
};

export const WithIconDanger: Story = {
  args: {
    variant: 'danger',
    icon: <XIcon />,
    children: 'Failed',
  },
};

export const WithIconInfo: Story = {
  args: {
    variant: 'info',
    icon: <Info />,
    children: 'Information',
  },
};

export const Removable: Story = {
  args: {
    variant: 'primary',
    removable: true,
    children: 'Removable',
  },
};

export const RemovableWithIcon: Story = {
  args: {
    variant: 'success',
    icon: <Star />,
    removable: true,
    children: 'Featured',
  },
};

export const NotRounded: Story = {
  args: {
    variant: 'primary',
    rounded: false,
    children: 'Not Rounded',
  },
};

// All Variants Example
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="gray">Gray</Badge>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// All Sizes Example
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Status Badges Example
export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success" icon={<Check />}>
        Active
      </Badge>
      <Badge variant="warning" icon={<AlertCircle />}>
        Pending
      </Badge>
      <Badge variant="danger" icon={<XIcon />}>
        Inactive
      </Badge>
      <Badge variant="info" icon={<Info />}>
        Draft
      </Badge>
      <Badge variant="gray">Archived</Badge>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// User Role Badges
export const UserRoleBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary" icon={<Star />}>
        Director
      </Badge>
      <Badge variant="success" icon={<User />}>
        Manager
      </Badge>
      <Badge variant="info">Homeowner</Badge>
      <Badge variant="gray">Tenant</Badge>
      <Badge variant="warning">Accountant</Badge>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Removable Tags Example
export const RemovableTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary" removable onRemove={() => alert('Removed React')}>
        React
      </Badge>
      <Badge variant="primary" removable onRemove={() => alert('Removed TypeScript')}>
        TypeScript
      </Badge>
      <Badge variant="primary" removable onRemove={() => alert('Removed Tailwind')}>
        Tailwind
      </Badge>
      <Badge variant="primary" removable onRemove={() => alert('Removed Vite')}>
        Vite
      </Badge>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Property Status Example
export const PropertyStatusExample: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <div className="p-4 border rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold">Ocean View Estate</h3>
          <Badge variant="success" icon={<Check />}>
            Active
          </Badge>
        </div>
        <p className="text-sm text-gray-600">50 units • 96% occupancy</p>
      </div>

      <div className="p-4 border rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold">Sunset Apartments</h3>
          <Badge variant="warning" icon={<AlertCircle />}>
            Maintenance
          </Badge>
        </div>
        <p className="text-sm text-gray-600">32 units • 88% occupancy</p>
      </div>

      <div className="p-4 border rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold">Downtown Complex</h3>
          <Badge variant="danger" icon={<XIcon />}>
            Inactive
          </Badge>
        </div>
        <p className="text-sm text-gray-600">75 units • 0% occupancy</p>
      </div>
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};

// Document Type Tags
export const DocumentTypeTags: Story = {
  render: () => (
    <div className="space-y-3 w-96">
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm">Annual Budget Report 2024.pdf</span>
        <Badge variant="info" size="sm">
          Financial
        </Badge>
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm">Board Meeting Minutes.docx</span>
        <Badge variant="primary" size="sm">
          Minutes
        </Badge>
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm">Building Inspection Report.pdf</span>
        <Badge variant="warning" size="sm">
          Inspection
        </Badge>
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm">Emergency Procedures.pdf</span>
        <Badge variant="danger" size="sm">
          Important
        </Badge>
      </div>
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};

// Notification Badges
export const NotificationBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm">Unread Messages</span>
        <Badge variant="danger" size="sm">
          12
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm">Pending Approvals</span>
        <Badge variant="warning" size="sm">
          5
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm">New Announcements</span>
        <Badge variant="info" size="sm">
          3
        </Badge>
      </div>
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};
