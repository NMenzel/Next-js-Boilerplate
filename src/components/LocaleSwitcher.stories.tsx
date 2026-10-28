import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { LocaleSwitcher } from './LocaleSwitcher';

const meta = {
  title: 'Components/LocaleSwitcher',
  component: LocaleSwitcher,
} satisfies Meta<typeof LocaleSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'English' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(canvas.getByRole('link', { name: 'Español' })).toHaveAttribute('hreflang', 'es');
  },
};

export const KeepsQuery: Story = {
  parameters: {
    nextjs: { navigation: { pathname: '/sign-in', query: { error: 'link_invalid' } } },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Español' })).toHaveAttribute(
      'href',
      '/es/sign-in?error=link_invalid',
    );
  },
};
