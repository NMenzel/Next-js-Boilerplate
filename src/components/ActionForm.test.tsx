import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { FormState } from './ActionForm';
import { ActionForm } from './ActionForm';

const fields = [
  {
    name: 'display_name',
    label: 'Display name',
    type: 'text' as const,
    autoComplete: 'nickname',
    error: 'Use 1 to 50 characters.',
  },
];

describe(ActionForm, () => {
  it('blocks submission and describes the error when client validation fails', async () => {
    const submissions: FormData[] = [];
    const action = async (_state: FormState, formData: FormData): Promise<FormState> => {
      submissions.push(formData);

      return await Promise.resolve({});
    };

    await render(
      <ActionForm action={action} validation="profile" fields={fields} submitLabel="Save" />,
    );
    const input = page.getByLabelText('Display name');
    await input.fill('   ');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.element(input).toHaveAttribute('aria-invalid', 'true');
    await expect.element(input).toHaveAccessibleDescription('Use 1 to 50 characters.');
    expect(submissions).toHaveLength(0);
  });

  it('sends valid input to the action and announces its result', async () => {
    const submissions: string[] = [];
    const action = async (_state: FormState, formData: FormData): Promise<FormState> => {
      const value = formData.get('display_name');
      submissions.push(typeof value === 'string' ? value : '');

      return await Promise.resolve({ status: 'success', message: 'Profile saved.' });
    };

    await render(
      <ActionForm action={action} validation="profile" fields={fields} submitLabel="Save" />,
    );
    await page.getByLabelText('Display name').fill('Ada');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.element(page.getByRole('status')).toHaveTextContent('Profile saved.');
    expect(submissions).toStrictEqual(['Ada']);
  });
});
