import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Button } from './Button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'elevated'],
      description: 'Visual variant of the card',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Padding size inside the card',
    },
    hoverable: {
      control: 'boolean',
      description: 'Adds hover effect',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600">
          This is a simple card with some content inside.
        </p>
      </>
    ),
  },
};

export const Bordered: Story = {
  args: {
    variant: 'bordered',
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Bordered Card</h3>
        <p className="text-gray-600">
          This card has a visible border for emphasis.
        </p>
      </>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Elevated Card</h3>
        <p className="text-gray-600">
          This card has a shadow effect to appear elevated.
        </p>
      </>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    variant: 'elevated',
    hoverable: true,
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Hoverable Card</h3>
        <p className="text-gray-600">
          Hover over this card to see the shadow effect intensify.
        </p>
      </>
    ),
  },
};

export const WithHeaderAndFooter: Story = {
  args: {
    variant: 'bordered',
    children: (
      <>
        <CardHeader
          title="Property Details"
          subtitle="View and manage property information"
        />
        <CardBody>
          <p className="text-gray-600">
            Property Name: Ocean View Estate
            <br />
            Address: 123 Beach Road, Miami, FL 33139
            <br />
            Units: 50
          </p>
        </CardBody>
        <CardFooter>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Save Changes</Button>
          </div>
        </CardFooter>
      </>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    variant: 'bordered',
    children: (
      <>
        <h3 className="text-sm font-semibold mb-1">Small Padding</h3>
        <p className="text-sm text-gray-600">Compact card with less padding.</p>
      </>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    variant: 'elevated',
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Large Padding</h3>
        <p className="text-gray-600">
          Spacious card with generous padding for important content.
        </p>
      </>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    variant: 'bordered',
    children: (
      <div className="divide-y divide-gray-200">
        <div className="p-4">
          <h3 className="font-semibold">Item 1</h3>
        </div>
        <div className="p-4">
          <h3 className="font-semibold">Item 2</h3>
        </div>
        <div className="p-4">
          <h3 className="font-semibold">Item 3</h3>
        </div>
      </div>
    ),
  },
};

// Property Card Example
export const PropertyCard: Story = {
  render: () => (
    <Card variant="elevated" hoverable className="max-w-md">
      <CardHeader title="Ocean View Estate" subtitle="Miami, FL" />
      <CardBody>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Units:</span>
            <span className="font-semibold">50</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Occupancy:</span>
            <span className="font-semibold">96%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-semibold">Residential</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly Fees:</span>
            <span className="font-semibold">$250/unit</span>
          </div>
        </div>
      </CardBody>
      <CardFooter>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" fullWidth>
            View Details
          </Button>
          <Button size="sm" fullWidth>
            Manage
          </Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

// Stats Dashboard Example
export const StatsDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Total Properties</p>
          <p className="text-3xl font-bold text-blue-600">24</p>
          <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
        </div>
      </Card>
      <Card variant="bordered" padding="md">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Active Users</p>
          <p className="text-3xl font-bold text-blue-600">1,234</p>
          <p className="text-xs text-green-600 mt-1">↑ 8% from last month</p>
        </div>
      </Card>
      <Card variant="bordered" padding="md">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Revenue</p>
          <p className="text-3xl font-bold text-blue-600">$45,678</p>
          <p className="text-xs text-red-600 mt-1">↓ 3% from last month</p>
        </div>
      </Card>
    </div>
  ),
};

// All Variants Example
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Card variant="default">
        <h3 className="font-semibold mb-2">Default Card</h3>
        <p className="text-sm text-gray-600">Basic card with no border or shadow.</p>
      </Card>
      <Card variant="bordered">
        <h3 className="font-semibold mb-2">Bordered Card</h3>
        <p className="text-sm text-gray-600">Card with a subtle border.</p>
      </Card>
      <Card variant="elevated">
        <h3 className="font-semibold mb-2">Elevated Card</h3>
        <p className="text-sm text-gray-600">Card with shadow for elevation effect.</p>
      </Card>
    </div>
  ),
};
