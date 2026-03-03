import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Ghost MCP',
  tagline: 'MCP server for Ghost CMS',
  favicon: 'img/favicon.ico',

  url: 'https://workspace.github.io',
  baseUrl: '/ghost-mcp/',

  organizationName: 'workspace',
  projectName: 'ghost-mcp',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/workspace/ghost-mcp/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Ghost MCP',
      logo: {
        alt: 'Ghost MCP Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/workspace/ghost-mcp',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started' },
            { label: 'Tools Reference', to: '/docs/tools/content-api' },
            { label: 'Deployment', to: '/docs/deployment/overview' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/workspace/ghost-mcp' },
            { label: 'npm', href: 'https://www.npmjs.com/package/@ryukimin/ghost-mcp' },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Ghost MCP. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'nginx', 'ini', 'yaml', 'docker'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
