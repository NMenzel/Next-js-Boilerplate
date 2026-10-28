/**
 * Lists the top-level field names that failed validation.
 * @param issues The issues of a failed Zod parse.
 * @returns Unique field names.
 */
export const getInvalidFields = (issues: { path: PropertyKey[] }[]) => [
  ...new Set(issues.map((issue) => String(issue.path[0]))),
];

/**
 * Reads a text field from submitted form data.
 * @param formData The submitted form data.
 * @param name The field name.
 * @returns The field value, or an empty string when missing or not text.
 */
export const getFormString = (formData: FormData, name: string) => {
  const value = formData.get(name);

  return typeof value === 'string' ? value : '';
};
