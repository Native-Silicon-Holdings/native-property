import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Alert } from './Alert';
import { Bell, Mail, Shield, Zap } from 'lucide-react';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
      description: 'The type/color of the alert',
    },
    dismissible: {
      control: 'boolean',
      description: 'Shows a dismiss button',
    },
    hideIcon: {
      control: 'boolean',
      description: 'Hides the icon',
    },
  },
  args: { onDismiss: fn() },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational message for the user.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully!',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Please review your information before submitting.',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'An error occurred while processing your request.',
  },
};

export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'New Feature Available',
    children: 'Check out the new dashboard analytics that help you track property performance.',
  },
};

export const WithTitleSuccess: Story = {
  args: {
    variant: 'success',
    title: 'Payment Processed',
    children: 'Your monthly maintenance fee of $250 has been successfully processed.',
  },
};

export const WithTitleWarning: Story = {
  args: {
    variant: 'warning',
    title: 'Maintenance Scheduled',
    children: 'Building maintenance is scheduled for this weekend. Water will be shut off from 9 AM to 12 PM.',
  },
};

export const WithTitleDanger: Story = {
  args: {
    variant: 'danger',
    title: 'Action Required',
    children: 'Your account payment is overdue. Please update your payment information to avoid service interruption.',
  },
};

export const Dismissible: Story = {
  args: {
    variant: 'info',
    dismissible: true,
    children: 'This alert can be dismissed by clicking the X button.',
  },
};

export const DismissibleWithTitle: Story = {
  args: {
    variant: 'success',
    title: 'Welcome!',
    dismissible: true,
    children: 'Thank you for joining the Estate Management Platform.',
  },
};

export const CustomIcon: Story = {
  args: {
    variant: 'info',
    icon: <Bell className="h-5 w-5" />,
    title: 'New Notification',
    children: 'You have 3 unread announcements.',
  },
};

export const NoIcon: Story = {
  args: {
    variant: 'info',
    hideIcon: true,
    children: 'This alert has no icon.',
  },
};

// All Variants Example
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="info">
        This is an informational message.
      </Alert>
      <Alert variant="success">
        This is a success message.
      </Alert>
      <Alert variant="warning">
        This is a warning message.
      </Alert>
      <Alert variant="danger">
        This is an error message.
      </Alert>
    </div>
  ),
};

// All with Titles
export const AllWithTitles: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="info" title="Information">
        This is an informational message with a title.
      </Alert>
      <Alert variant="success" title="Success">
        This is a success message with a title.
      </Alert>
      <Alert variant="warning" title="Warning">
        This is a warning message with a title.
      </Alert>
      <Alert variant="danger" title="Error">
        This is an error message with a title.
      </Alert>
    </div>
  ),
};

// Property Management Examples
export const PaymentReminder: Story = {
  render: () => (
    <Alert variant="warning" title="Payment Due Soon" dismissible>
      <p className="mb-2">
        Your monthly maintenance fee of <strong>$250.00</strong> is due on <strong>November 30, 2024</strong>.
      </p>
      <p className="text-sm">
        Please ensure payment is made to avoid late fees.
      </p>
    </Alert>
  ),
};

export const MaintenanceNotice: Story = {
  render: () => (
    <Alert variant="info" title="Scheduled Maintenance" icon={<Zap className="h-5 w-5" />}>
      <p className="mb-2">
        <strong>Date:</strong> Saturday, November 16, 2024<br />
        <strong>Time:</strong> 9:00 AM - 12:00 PM
      </p>
      <p>
        Electricity will be temporarily shut off in Building A for electrical panel upgrades.
      </p>
    </Alert>
  ),
};

export const SecurityAlert: Story = {
  render: () => (
    <Alert variant="danger" title="Security Alert" icon={<Shield className="h-5 w-5" />} dismissible>
      <p className="mb-2">
        We detected a suspicious login attempt to your account from an unrecognized device.
      </p>
      <p>
        <strong>Location:</strong> New York, NY<br />
        <strong>Time:</strong> Today at 2:15 PM
      </p>
      <p className="mt-2">
        If this wasn't you, please change your password immediately.
      </p>
    </Alert>
  ),
};

export const NewAnnouncement: Story = {
  render: () => (
    <Alert variant="info" title="New Board Meeting Scheduled" icon={<Mail className="h-5 w-5" />} dismissible>
      <p>
        The next board meeting is scheduled for <strong>December 1, 2024 at 6:00 PM</strong> in the community room.
      </p>
      <p className="mt-2 text-sm">
        All homeowners are welcome to attend. RSVP by November 25th.
      </p>
    </Alert>
  ),
};

export const SuccessfulAction: Story = {
  render: () => (
    <Alert variant="success" title="Document Uploaded Successfully" dismissible>
      <p>
        Your document <strong>"Insurance Policy 2024.pdf"</strong> has been uploaded and is now available in the document library.
      </p>
    </Alert>
  ),
};

// Multiple Alerts Example
export const MultipleAlerts: Story = {
  render: () => (
    <div className="space-y-3">
      <Alert variant="danger" title="Payment Overdue" dismissible>
        Your maintenance fee is 15 days overdue. Please pay immediately to avoid additional charges.
      </Alert>
      <Alert variant="warning" title="Document Expiring Soon">
        Your building insurance policy expires in 30 days.
      </Alert>
      <Alert variant="info" title="New Feature">
        Check out our new mobile app for easier property management on the go.
      </Alert>
      <Alert variant="success" title="Maintenance Completed">
        The elevator repair has been completed successfully.
      </Alert>
    </div>
  ),
};

// Form Validation Example
export const FormValidation: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Alert variant="danger" title="Form Errors">
        <ul className="list-disc list-inside space-y-1">
          <li>Email address is required</li>
          <li>Password must be at least 12 characters</li>
          <li>Please accept the terms and conditions</li>
        </ul>
      </Alert>

      <form className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" className="w-full px-3 py-2 border rounded" />
        </div>
      </form>
    </div>
  ),
};

// Long Content Example
export const LongContent: Story = {
  render: () => (
    <Alert variant="info" title="Terms and Conditions Update" dismissible>
      <p className="mb-2">
        We've updated our Terms and Conditions to better serve you and ensure transparency.
      </p>
      <p className="mb-2">
        Key changes include:
      </p>
      <ul className="list-disc list-inside space-y-1 mb-2">
        <li>Enhanced privacy protections for your personal data</li>
        <li>Clarified payment processing timelines</li>
        <li>Updated maintenance request procedures</li>
        <li>New emergency contact protocols</li>
      </ul>
      <p>
        Please review the full terms at your earliest convenience. Continued use of the platform constitutes acceptance of these updated terms.
      </p>
    </Alert>
  ),
};
