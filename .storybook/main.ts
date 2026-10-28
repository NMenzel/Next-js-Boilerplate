import type { StorybookConfig } from '@storybook/nextjs-vite';
import { loadEnv } from 'vite';

// The Next.js framework evaluates next.config.ts, which validates env vars, before any .env file is
// loaded. Load .env and .env.local without overriding variables that are already set.
for (const [key, value] of Object.entries(loadEnv('', process.cwd(), ''))) {
  process.env[key] ??= value;
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  core: {
    disableTelemetry: true,
  },
};

export default config;
