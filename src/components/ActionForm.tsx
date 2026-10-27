'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { startTransition, useActionState, useId } from 'react';
import { useForm } from 'react-hook-form';
import type { FormValidationName } from '@/validations/AuthValidation';
import { FormValidations } from '@/validations/AuthValidation';

export type FormState = {
  status?: 'error' | 'success';
  message?: string;
  invalidFields?: string[];
  values?: Record<string, string>;
};

type Field = {
  name: string;
  label: string;
  type: 'email' | 'password' | 'text';
  autoComplete: string;
  hint?: string;
  error: string;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
};

/**
 * Renders an accessible form bound to a Server Action. With JavaScript, React Hook Form validates
 * the shared Zod schema before submitting; without it, the form posts natively and the Server Action
 * validates the same schema.
 * @param props The component props.
 * @param props.action The Server Action that validates input and returns the next state.
 * @param props.validation The name of the shared Zod schema for client-side validation.
 * @param props.fields The fields to render, in order.
 * @param props.submitLabel The visible submit button label.
 * @param props.initialState The state before the first submission, e.g. an error from a redirect.
 * @returns The form element.
 */
export const ActionForm = (props: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  validation: FormValidationName;
  fields: Field[];
  submitLabel: string;
  initialState?: FormState;
}) => {
  const id = useId();
  const [state, formAction, isPending] = useActionState(props.action, props.initialState ?? {});
  const form = useForm<Record<string, string>>({
    resolver: zodResolver<Record<string, string>, unknown, Record<string, string>>(
      FormValidations[props.validation],
    ),
    // Include the values returned by a native submission made before hydration; `register`
    // overwrites the input with these defaults.
    defaultValues: Object.fromEntries(
      props.fields.map((field) => [
        field.name,
        state.values?.[field.name] ?? field.defaultValue ?? '',
      ]),
    ),
  });
  // Read formState at the top of render: `form` is a stable object, so reads nested in callbacks
  // would be memoized by the React Compiler and never show new errors.
  const { errors } = form.formState;
  const isError = state.status === 'error';

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(event) => {
        // Client-side validation first; the Server Action still validates everything it receives.
        event.preventDefault();
        const formElement = event.currentTarget;
        void form.handleSubmit(() => {
          startTransition(() => {
            formAction(new FormData(formElement));
          });
        })(event);
      }}
      className="flex max-w-sm flex-col gap-4 text-base"
    >
      {state.message && (
        <p
          role={isError ? 'alert' : 'status'}
          className={isError ? 'font-medium text-red-700' : 'font-medium text-green-800'}
        >
          {state.message}
        </p>
      )}

      {props.fields.map((field) => {
        const inputId = `${id}-${field.name}`;
        const isInvalid =
          Boolean(errors[field.name]) || (state.invalidFields?.includes(field.name) ?? false);
        const describedBy = [
          field.hint && `${inputId}-hint`,
          isInvalid && `${inputId}-error`,
        ].filter(Boolean);

        return (
          <div key={field.name} className="flex flex-col gap-1">
            <label htmlFor={inputId} className="font-medium text-gray-900">
              {field.label}
            </label>
            <input
              id={inputId}
              type={field.type}
              autoComplete={field.autoComplete}
              defaultValue={state.values?.[field.name] ?? field.defaultValue}
              minLength={field.minLength}
              maxLength={field.maxLength}
              required
              aria-invalid={isInvalid}
              aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
              className="rounded-sm border border-gray-500 px-2 py-1 text-gray-900 aria-invalid:border-red-700"
              {...form.register(field.name)}
            />
            {field.hint && (
              <p id={`${inputId}-hint`} className="text-sm text-gray-700">
                {field.hint}
              </p>
            )}
            {isInvalid && (
              <p id={`${inputId}-error`} className="text-sm text-red-700">
                {field.error}
              </p>
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-sm bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {props.submitLabel}
      </button>
    </form>
  );
};
