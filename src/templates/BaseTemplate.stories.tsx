import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BaseTemplate } from './BaseTemplate';

const meta = {
  title: 'Templates/BaseTemplate',
  component: BaseTemplate,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BaseTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithNavigation: Story = {
  args: {
    leftNav: (
      <>
        <li>Home</li>
        <li>About</li>
      </>
    ),
    rightNav: <li>Sign in</li>,
    children: <h1 className="text-2xl font-bold">Page heading</h1>,
  },
};
