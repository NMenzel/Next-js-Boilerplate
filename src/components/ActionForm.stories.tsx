import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import type { FormState } from './ActionForm';
import { ActionForm } from './ActionForm';

const meta = {
  title: 'Components/ActionForm',
  component: ActionForm,
  args: {
    action: fn(async (_state: FormState, _formData: FormData) => await Promise.resolve({})),
    validation: 'signIn',
    submitLabel: 'Sign in',
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        autoComplete: 'email',
        error: 'Enter a valid email address.',
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        autoComplete: 'current-password',
        error: 'Enter your password.',
      },
    ],
  },
} satisfies Meta<typeof ActionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ServerError: Story = {
  args: {
    initialState: { status: 'error', message: 'Invalid email or password.' },
  },
};

export const ClientValidation: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));

    await expect(canvas.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByLabelText('Email')).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
    await expect(args.action).not.toHaveBeenCalled();
  },
};
