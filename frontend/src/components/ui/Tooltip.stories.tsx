import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Button } from './Button';
import { Info, HelpCircle, Settings, User } from 'lucide-react';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Position of the tooltip relative to trigger',
    },
    delay: {
      control: 'number',
      description: 'Delay before showing tooltip (ms)',
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {
  args: {
    content: 'This is a tooltip on top',
    position: 'top',
    children: <Button>Hover me (Top)</Button>,
  },
};

export const Bottom: Story = {
  args: {
    content: 'This is a tooltip on bottom',
    position: 'bottom',
    children: <Button>Hover me (Bottom)</Button>,
  },
};

export const Left: Story = {
  args: {
    content: 'This is a tooltip on left',
    position: 'left',
    children: <Button>Hover me (Left)</Button>,
  },
};

export const Right: Story = {
  args: {
    content: 'This is a tooltip on right',
    position: 'right',
    children: <Button>Hover me (Right)</Button>,
  },
};

export const WithIcon: Story = {
  render: () => (
    <Tooltip content="Click for more information">
      <button className="p-2 text-blue-600 hover:text-blue-700">
        <Info className="h-5 w-5" />
      </button>
    </Tooltip>
  ),
};

export const WithHelpIcon: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <span>Need help?</span>
      <Tooltip content="Contact support at support@example.com">
        <button className="p-1 text-gray-600 hover:text-gray-700">
          <HelpCircle className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Tooltip content="This is a much longer tooltip with more detailed information about this feature">
      <Button variant="outline">Hover for details</Button>
    </Tooltip>
  ),
};

export const NoDelay: Story = {
  args: {
    content: 'Appears immediately',
    delay: 0,
    children: <Button>Hover me (No delay)</Button>,
  },
};

export const LongDelay: Story = {
  args: {
    content: 'Appears after 1 second',
    delay: 1000,
    children: <Button>Hover me (1s delay)</Button>,
  },
};

// All Positions Example
export const AllPositions: Story = {
  render: () => (
    <div className="flex items-center justify-center gap-8 p-20">
      <Tooltip content="Left tooltip" position="left">
        <Button variant="outline">Left</Button>
      </Tooltip>

      <div className="flex flex-col gap-8">
        <Tooltip content="Top tooltip" position="top">
          <Button variant="outline">Top</Button>
        </Tooltip>
        <Tooltip content="Bottom tooltip" position="bottom">
          <Button variant="outline">Bottom</Button>
        </Tooltip>
      </div>

      <Tooltip content="Right tooltip" position="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

// Form Field Helper Example
export const FormFieldHelper: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Tooltip content="Password must be at least 12 characters with uppercase, lowercase, number, and special character">
            <button className="text-gray-400 hover:text-gray-600">
              <HelpCircle className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
        <input
          type="password"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter password"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Property Units
          </label>
          <Tooltip content="Total number of residential or commercial units in the property">
            <button className="text-gray-400 hover:text-gray-600">
              <HelpCircle className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
        <input
          type="number"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="50"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};

// Icon Button Tooltips
export const IconButtonTooltips: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip content="User Profile">
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <User className="h-5 w-5" />
        </button>
      </Tooltip>

      <Tooltip content="Settings">
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <Settings className="h-5 w-5" />
        </button>
      </Tooltip>

      <Tooltip content="Help & Support">
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <HelpCircle className="h-5 w-5" />
        </button>
      </Tooltip>

      <Tooltip content="Information">
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <Info className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  ),
};

// Property Card Example
export const PropertyCardExample: Story = {
  render: () => (
    <div className="w-96 p-6 border rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">Ocean View Estate</h3>
          <p className="text-sm text-gray-600">Miami, FL</p>
        </div>
        <Tooltip content="Property details and statistics">
          <button className="text-gray-400 hover:text-gray-600">
            <Info className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Units:</span>
            <Tooltip content="Total number of units in the property">
              <button className="text-gray-400 hover:text-gray-600">
                <HelpCircle className="h-3 w-3" />
              </button>
            </Tooltip>
          </div>
          <span className="font-semibold">50</span>
        </div>

        <div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Occupancy:</span>
            <Tooltip content="Percentage of occupied units">
              <button className="text-gray-400 hover:text-gray-600">
                <HelpCircle className="h-3 w-3" />
              </button>
            </Tooltip>
          </div>
          <span className="font-semibold">96%</span>
        </div>

        <div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Monthly Fee:</span>
            <Tooltip content="Average monthly maintenance fee per unit">
              <button className="text-gray-400 hover:text-gray-600">
                <HelpCircle className="h-3 w-3" />
              </button>
            </Tooltip>
          </div>
          <span className="font-semibold">$250</span>
        </div>

        <div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Type:</span>
            <Tooltip content="Property classification">
              <button className="text-gray-400 hover:text-gray-600">
                <HelpCircle className="h-3 w-3" />
              </button>
            </Tooltip>
          </div>
          <span className="font-semibold">Residential</span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};

// Button Group with Tooltips
export const ButtonGroupWithTooltips: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip content="Save changes">
        <Button size="sm">Save</Button>
      </Tooltip>

      <Tooltip content="Discard all changes">
        <Button size="sm" variant="outline">Cancel</Button>
      </Tooltip>

      <Tooltip content="Delete this item permanently">
        <Button size="sm" variant="danger">Delete</Button>
      </Tooltip>
    </div>
  ),
};

// Data Table Example
export const DataTableExample: Story = {
  render: () => (
    <div className="overflow-x-auto">
      <table className="min-w-full border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium">
              <div className="flex items-center gap-1">
                Property Name
                <Tooltip content="Click to sort by property name">
                  <button className="text-gray-400 hover:text-gray-600">
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </Tooltip>
              </div>
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium">
              <div className="flex items-center gap-1">
                Occupancy
                <Tooltip content="Percentage of occupied units">
                  <button className="text-gray-400 hover:text-gray-600">
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </Tooltip>
              </div>
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium">
              <div className="flex items-center gap-1">
                Status
                <Tooltip content="Current property status">
                  <button className="text-gray-400 hover:text-gray-600">
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </Tooltip>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="px-4 py-2">Ocean View Estate</td>
            <td className="px-4 py-2">96%</td>
            <td className="px-4 py-2">Active</td>
          </tr>
          <tr className="border-t">
            <td className="px-4 py-2">Sunset Apartments</td>
            <td className="px-4 py-2">88%</td>
            <td className="px-4 py-2">Active</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
