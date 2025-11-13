import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select, SelectOption } from './Select';

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the select',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the select',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes the select full width',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const basicOptions: SelectOption[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4' },
];

const propertyTypes: SelectOption[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed', label: 'Mixed Use' },
  { value: 'industrial', label: 'Industrial' },
];

const userRoles: SelectOption[] = [
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'accountant', label: 'Accountant' },
];

const statuses: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export const Basic: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Select
        options={basicOptions}
        value={value}
        onChange={setValue}
        placeholder="Select an option"
      />
    );
  },
};

export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Select
        options={propertyTypes}
        value={value}
        onChange={setValue}
        label="Property Type"
        placeholder="Choose property type"
      />
    );
  },
};

export const WithPreselected: Story = {
  render: () => {
    const [value, setValue] = useState('residential');
    return (
      <Select
        options={propertyTypes}
        value={value}
        onChange={setValue}
        label="Property Type"
      />
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Select
        options={userRoles}
        value={value}
        onChange={setValue}
        label="User Role"
        error="Please select a user role"
      />
    );
  },
};

export const Disabled: Story = {
  render: () => {
    return (
      <Select
        options={basicOptions}
        value="1"
        label="Disabled Select"
        disabled
      />
    );
  },
};

export const DisabledOptions: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const options: SelectOption[] = [
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending (Disabled)', disabled: true },
      { value: 'inactive', label: 'Inactive' },
      { value: 'archived', label: 'Archived (Disabled)', disabled: true },
    ];

    return (
      <Select
        options={options}
        value={value}
        onChange={setValue}
        label="Status"
        placeholder="Select status"
      />
    );
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Select
        options={propertyTypes}
        value={value}
        onChange={setValue}
        label="Small Select"
        size="sm"
      />
    );
  },
};

export const Large: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Select
        options={propertyTypes}
        value={value}
        onChange={setValue}
        label="Large Select"
        size="lg"
      />
    );
  },
};

export const FullWidth: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-96">
        <Select
          options={propertyTypes}
          value={value}
          onChange={setValue}
          label="Full Width Select"
          fullWidth
        />
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};

// Long List Example
export const LongList: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const longOptions: SelectOption[] = Array.from({ length: 50 }, (_, i) => ({
      value: `option-${i + 1}`,
      label: `Option ${i + 1}`,
    }));

    return (
      <Select
        options={longOptions}
        value={value}
        onChange={setValue}
        label="Long List"
        placeholder="Select from many options"
      />
    );
  },
};

// Form Example
export const FormExample: Story = {
  render: () => {
    const [propertyType, setPropertyType] = useState('');
    const [status, setStatus] = useState('');
    const [role, setRole] = useState('');

    return (
      <div className="w-96 space-y-4">
        <Select
          options={propertyTypes}
          value={propertyType}
          onChange={setPropertyType}
          label="Property Type"
          placeholder="Select property type"
          fullWidth
        />
        <Select
          options={statuses}
          value={status}
          onChange={setStatus}
          label="Status"
          placeholder="Select status"
          fullWidth
        />
        <Select
          options={userRoles}
          value={role}
          onChange={setRole}
          label="User Role"
          placeholder="Select role"
          fullWidth
        />
      </div>
    );
  },
  parameters: {
    layout: 'centered',
  },
};

// Property Management Example
export const PropertyFilterExample: Story = {
  render: () => {
    const [propertyType, setPropertyType] = useState('');
    const [status, setStatus] = useState('');

    const properties = [
      { name: 'Ocean View Estate', type: 'residential', status: 'active', units: 50 },
      { name: 'Downtown Office Complex', type: 'commercial', status: 'active', units: 25 },
      { name: 'Sunset Apartments', type: 'residential', status: 'pending', units: 32 },
    ];

    const filteredProperties = properties.filter((p) => {
      if (propertyType && p.type !== propertyType) return false;
      if (status && p.status !== status) return false;
      return true;
    });

    return (
      <div className="w-96 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select
            options={[
              { value: '', label: 'All Types' },
              ...propertyTypes,
            ]}
            value={propertyType}
            onChange={setPropertyType}
            label="Property Type"
            size="sm"
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              ...statuses,
            ]}
            value={status}
            onChange={setStatus}
            label="Status"
            size="sm"
          />
        </div>

        <div className="border rounded-lg divide-y">
          {filteredProperties.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No properties found
            </div>
          ) : (
            filteredProperties.map((property, index) => (
              <div key={index} className="p-3">
                <h4 className="font-semibold">{property.name}</h4>
                <p className="text-sm text-gray-600">
                  {property.units} units • {property.type} • {property.status}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'centered',
  },
};

// User Management Example
export const UserManagementExample: Story = {
  render: () => {
    const [role, setRole] = useState('');

    return (
      <div className="w-96 space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Add New User</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="john@example.com"
              />
            </div>
            <Select
              options={userRoles}
              value={role}
              onChange={setRole}
              label="Role"
              placeholder="Select user role"
              fullWidth
            />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'centered',
  },
};

// All Sizes Example
export const AllSizes: Story = {
  render: () => {
    const [sm, setSm] = useState('');
    const [md, setMd] = useState('');
    const [lg, setLg] = useState('');

    return (
      <div className="space-y-4">
        <Select
          options={propertyTypes}
          value={sm}
          onChange={setSm}
          label="Small"
          size="sm"
        />
        <Select
          options={propertyTypes}
          value={md}
          onChange={setMd}
          label="Medium"
          size="md"
        />
        <Select
          options={propertyTypes}
          value={lg}
          onChange={setLg}
          label="Large"
          size="lg"
        />
      </div>
    );
  },
  parameters: {
    layout: 'centered',
  },
};
