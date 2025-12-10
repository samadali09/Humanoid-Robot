import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Physical AI & Robotics Book',
      items: [
        'module-1-ros2-nervous-system',
        'module-2-digital-twin',
        'module-3-ai-robot-brain',
        'module-4-vla-capstone',
      ],
    },
  ],
};

export default sidebars;