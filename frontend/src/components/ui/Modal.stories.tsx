import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { AlertCircle, Info, CheckCircle } from 'lucide-react';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'The size of the modal',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description: 'Close modal when clicking outside',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Close modal when pressing Escape key',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show the X close button',
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Modal
export const Basic: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Basic Modal">
          <p className="text-gray-600">
            This is a basic modal with a title and close button. Click outside or press Escape to close.
          </p>
        </Modal>
      </>
    );
  },
};

// Small Modal
export const Small: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Small Modal</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Small Modal" size="sm">
          <p className="text-sm text-gray-600">
            This is a small modal, perfect for simple confirmations or alerts.
          </p>
        </Modal>
      </>
    );
  },
};

// Large Modal
export const Large: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Large Modal</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Large Modal" size="lg">
          <div className="space-y-4">
            <p className="text-gray-600">
              This is a larger modal with more content space.
            </p>
            <p className="text-gray-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p className="text-gray-600">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
        </Modal>
      </>
    );
  },
};

// Modal with Footer
export const WithFooter: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal with Footer</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirm Action"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Confirm</Button>
            </>
          }
        >
          <p className="text-gray-600">
            Are you sure you want to proceed with this action? This cannot be undone.
          </p>
        </Modal>
      </>
    );
  },
};

// Confirmation Dialog
export const ConfirmationDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Property
        </Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Delete Property"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  alert('Property deleted!');
                  setIsOpen(false);
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete this property? This action cannot be undone.
              </p>
              <p className="text-sm font-semibold text-gray-900">
                Ocean View Estate
              </p>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

// Form Modal
export const FormModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Add New Property</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Add New Property"
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  alert('Property added!');
                  setIsOpen(false);
                }}
              >
                Add Property
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <Input label="Property Name" placeholder="Enter property name" required fullWidth />
            <Input label="Address" placeholder="Enter address" required fullWidth />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Units" type="number" placeholder="50" required />
              <Input label="Type" placeholder="Residential" required />
            </div>
            <Input
              label="Description"
              placeholder="Enter description"
              fullWidth
            />
          </form>
        </Modal>
      </>
    );
  },
};

// Success Modal
export const SuccessModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="success" onClick={() => setIsOpen(true)}>
          Show Success
        </Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size="sm"
          footer={
            <Button onClick={() => setIsOpen(false)} fullWidth>
              Continue
            </Button>
          }
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Payment Successful
            </h3>
            <p className="text-sm text-gray-600">
              Your payment of $1,250.00 has been processed successfully.
            </p>
          </div>
        </Modal>
      </>
    );
  },
};

// Info Modal
export const InfoModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          View Information
        </Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Property Information"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Ocean View Estate</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Address:</strong> 123 Beach Road, Miami, FL 33139</p>
                  <p><strong>Units:</strong> 50</p>
                  <p><strong>Occupancy:</strong> 96%</p>
                  <p><strong>Type:</strong> Residential</p>
                  <p><strong>Year Built:</strong> 2018</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  },
};

// No Close on Backdrop
export const NoCloseOnBackdrop: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Important Action Required"
          closeOnBackdropClick={false}
          footer={
            <Button onClick={() => setIsOpen(false)}>I Understand</Button>
          }
        >
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              This modal cannot be closed by clicking outside. You must use the close button or footer action.
            </p>
          </div>
        </Modal>
      </>
    );
  },
};

// Scrollable Content
export const ScrollableContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Scrollable Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Terms and Conditions"
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Decline
              </Button>
              <Button onClick={() => setIsOpen(false)}>Accept</Button>
            </>
          }
        >
          <div className="space-y-4 text-sm text-gray-600">
            {Array.from({ length: 20 }).map((_, i) => (
              <p key={i}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
            ))}
          </div>
        </Modal>
      </>
    );
  },
};

// Multiple Modals (nested)
export const NestedModals: Story = {
  render: () => {
    const [firstOpen, setFirstOpen] = useState(false);
    const [secondOpen, setSecondOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setFirstOpen(true)}>Open First Modal</Button>
        <Modal
          isOpen={firstOpen}
          onClose={() => setFirstOpen(false)}
          title="First Modal"
          footer={
            <>
              <Button variant="outline" onClick={() => setFirstOpen(false)}>
                Close
              </Button>
              <Button onClick={() => setSecondOpen(true)}>Open Second Modal</Button>
            </>
          }
        >
          <p className="text-gray-600">
            This is the first modal. Click the button below to open a second modal.
          </p>
        </Modal>

        <Modal
          isOpen={secondOpen}
          onClose={() => setSecondOpen(false)}
          title="Second Modal"
          size="sm"
          footer={
            <Button onClick={() => setSecondOpen(false)} fullWidth>
              Close Second Modal
            </Button>
          }
        >
          <p className="text-gray-600">
            This is the second modal, opened from within the first modal.
          </p>
        </Modal>
      </>
    );
  },
};
