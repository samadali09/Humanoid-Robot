import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {

  title: 'AI Humanoid Robotics',
  tagline: 'Complete Detail related to Humanoid Robotics',
  favicon: 'img/favicon.ico',

  // Production URL yahan daalein (filhal dummy hai)
  url: 'https://your-docusaurus-site.example.com',
  // Base URL '/' rakhein agar root domain hai
  baseUrl: '/',

  // GitHub Pages deployment config (optional but recommended)
  organizationName: 'VLA-Capstone', 
  projectName: 'humanoid-robot-docs', 

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Internationalization settings
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  // -----------------------------------------

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Navbar Settings
    navbar: {
      title: 'AI Humanoid Robotics',
      logo: {
        alt: 'AI Book',
        // Note: Make sure ye image 'static/img/logo.svg' mein maujood ho
        src: 'img/logo.svg', 
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'AI Robotics Docs',
        },
      
      ],
    },
    

    // Prism Code Block Theme
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;