import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'getting-started',
    'configuration',
    {
      type: 'category',
      label: 'Tools Reference',
      collapsed: false,
      items: [
        'tools/content-api',
        {
          type: 'category',
          label: 'Admin API',
          collapsed: true,
          items: [
            'tools/admin-api/posts',
            'tools/admin-api/pages',
            'tools/admin-api/tags',
            'tools/admin-api/members',
            'tools/admin-api/tiers',
            'tools/admin-api/newsletters',
            'tools/admin-api/offers',
            'tools/admin-api/users',
            'tools/admin-api/roles-invites',
            'tools/admin-api/webhooks',
            'tools/admin-api/site-settings',
            'tools/admin-api/images',
            'tools/admin-api/themes',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Usage Examples',
      items: [
        'examples/content-api-examples',
        'examples/admin-api-examples',
        'examples/common-workflows',
      ],
    },
    'nql-reference',
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/overview',
        'deployment/local-stdio',
        'deployment/remote-sse',
        'deployment/docker',
        'deployment/systemd-nginx',
        'deployment/cloud',
        'deployment/production',
      ],
    },
    'troubleshooting',
  ],
};

export default sidebars;
