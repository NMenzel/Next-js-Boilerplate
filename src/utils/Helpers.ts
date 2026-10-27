import { routing } from '@/libs/I18nRouting';

/**
 * Builds a locale-aware path by prefixing non-default locales.
 * @param url The base application-relative path starting with a slash.
 * @param locale The active locale identifier.
 * @returns The localized path, prefixed when the locale is not the default locale.
 */
export const getI18nPath = (url: string, locale: string) => {
  if (locale === routing.defaultLocale) {
    return url;
  }

  return `/${locale}${url}`;
};

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
