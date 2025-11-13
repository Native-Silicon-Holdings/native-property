import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  // User Guide Sidebar
  userGuideSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'user-guide/getting-started',
        'user-guide/first-login',
        'user-guide/dashboard-overview',
        'user-guide/desktop-app',
      ],
    },
    {
      type: 'category',
      label: 'Authentication',
      items: [
        'user-guide/authentication/login',
        'user-guide/authentication/two-factor',
        'user-guide/authentication/facial-authentication',
        'user-guide/authentication/password-reset',
        'user-guide/authentication/profile-settings',
      ],
    },
    {
      type: 'category',
      label: 'Core Features',
      items: [
        'user-guide/documents',
        'user-guide/announcements',
        'user-guide/meetings',
        'user-guide/utilities',
        'user-guide/maintenance',
        'user-guide/properties',
      ],
    },
    {
      type: 'category',
      label: 'User Roles',
      items: [
        'user-guide/roles/director',
        'user-guide/roles/manager',
        'user-guide/roles/homeowner',
        'user-guide/roles/tenant',
        'user-guide/roles/accountant',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'user-guide/troubleshooting/common-issues',
        'user-guide/troubleshooting/facial-auth-issues',
        'user-guide/troubleshooting/upload-issues',
      ],
    },
    {
      type: 'category',
      label: 'Enterprise',
      items: [
        'enterprise/features',
      ],
    },
  ],

  // Developer Documentation Sidebar
  developerSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'developer/setup',
        'developer/architecture',
        'developer/tech-stack',
        'developer/project-structure',
      ],
    },
    {
      type: 'category',
      label: 'Backend Development',
      items: [
        'developer/backend/setup',
        'developer/backend/database',
        'developer/backend/authentication',
        'developer/backend/file-uploads',
        'developer/backend/testing',
      ],
    },
    {
      type: 'category',
      label: 'Frontend Development',
      items: [
        'developer/frontend/setup',
        'developer/frontend/components',
        'developer/frontend/routing',
        'developer/frontend/state-management',
        'developer/frontend/testing',
      ],
    },
    {
      type: 'category',
      label: 'Facial Authentication',
      items: [
        'developer/facial-auth/overview',
        'developer/facial-auth/implementation',
        'developer/facial-auth/security',
        'developer/facial-auth/testing',
        'developer/facial-auth/production',
      ],
    },
    {
      type: 'category',
      label: 'Testing',
      items: [
        'developer/testing/overview',
        'developer/testing/unit-tests',
        'developer/testing/integration-tests',
        'developer/testing/e2e-tests',
        'developer/testing/security-tests',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'developer/deployment/docker',
        'developer/deployment/production',
        'developer/deployment/ci-cd',
        'developer/deployment/monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      items: [
        'developer/security',
        'developer/security/authentication',
        'developer/security/authorization',
        'developer/security/rate-limiting',
        'developer/security/input-validation',
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: [
        'developer/contributing/guidelines',
        'developer/contributing/code-style',
        'developer/contributing/pull-requests',
        'developer/contributing/reporting-bugs',
      ],
    },
  ],

  // API Reference Sidebar
  apiSidebar: [
    {
      type: 'category',
      label: 'API Overview',
      items: [
        'api/overview',
        'api/authentication',
        'api/error-handling',
        'api/rate-limiting',
      ],
    },
    {
      type: 'category',
      label: 'Authentication',
      items: [
        'api/auth/register',
        'api/auth/login',
        'api/auth/profile',
        'api/auth/password',
      ],
    },
    {
      type: 'category',
      label: 'Facial Authentication',
      items: [
        'api/facial-auth/initialize',
        'api/facial-auth/upload',
        'api/facial-auth/status',
        'api/facial-auth/login',
        'api/facial-auth/manage',
      ],
    },
    {
      type: 'category',
      label: 'Documents',
      items: [
        'api/documents/list',
        'api/documents/get',
        'api/documents/upload',
        'api/documents/update',
        'api/documents/delete',
      ],
    },
    {
      type: 'category',
      label: 'Announcements',
      items: [
        'api/announcements/list',
        'api/announcements/get',
        'api/announcements/create',
        'api/announcements/update',
        'api/announcements/delete',
      ],
    },
    {
      type: 'category',
      label: 'Utilities',
      items: [
        'api/utilities/readings',
        'api/utilities/consumption',
        'api/utilities/create',
        'api/utilities/bulk',
      ],
    },
    {
      type: 'category',
      label: 'Meetings',
      items: [
        'api/meetings/list',
        'api/meetings/get',
        'api/meetings/create',
        'api/meetings/rsvp',
      ],
    },
    {
      type: 'category',
      label: 'Maintenance',
      items: [
        'api/maintenance/list',
        'api/maintenance/get',
        'api/maintenance/create',
        'api/maintenance/update',
      ],
    },
    {
      type: 'category',
      label: 'Properties',
      items: [
        'api/properties/list',
        'api/properties/get',
        'api/properties/create',
        'api/properties/update',
      ],
    },
    {
      type: 'category',
      label: 'Users',
      items: [
        'api/users/list',
        'api/users/get',
        'api/users/update',
        'api/users/deactivate',
      ],
    },
  ],
};

export default sidebars;
