import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Estate Management Platform',
  tagline: 'Comprehensive residential estate management solution',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://estate-management-docs.example.com',
  baseUrl: '/',

  organizationName: 'estate-management',
  projectName: 'native-property',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Coded-Shogun/native-property/tree/main/docs/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/Coded-Shogun/native-property/tree/main/docs/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/estate-management-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Estate Management',
      logo: {
        alt: 'Estate Management Platform Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'userGuideSidebar',
          position: 'left',
          label: 'User Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'developerSidebar',
          position: 'left',
          label: 'Developer Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          to: '/blog',
          label: 'Changelog',
          position: 'left'
        },
        {
          href: 'https://github.com/Coded-Shogun/native-property',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'User Guide',
              to: '/docs/user-guide/getting-started',
            },
            {
              label: 'Developer Guide',
              to: '/docs/developer/setup',
            },
            {
              label: 'API Reference',
              to: '/docs/api/overview',
            },
          ],
        },
        {
          title: 'Features',
          items: [
            {
              label: 'Facial Authentication',
              to: '/docs/user-guide/facial-authentication',
            },
            {
              label: 'Document Management',
              to: '/docs/user-guide/documents',
            },
            {
              label: 'Utility Billing',
              to: '/docs/user-guide/utilities',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Changelog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/Coded-Shogun/native-property',
            },
            {
              label: 'Security',
              to: '/docs/developer/security',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Estate Management Platform. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'javascript', 'json', 'docker', 'nginx'],
    },
    algolia: {
      // If you have Algolia search configured
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'estate-management',
      contextualSearch: true,
    },
    announcementBar: {
      id: 'announcement-bar',
      content:
        '⭐️ If you like Estate Management Platform, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/Coded-Shogun/native-property">GitHub</a>! ⭐️',
      backgroundColor: '#fafbfc',
      textColor: '#091E42',
      isCloseable: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
