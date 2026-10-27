import { Env } from '@/libs/Env';
import { routing } from '@/libs/I18nRouting';

/**
 * Resolves the public base URL of the application.
 * @returns The configured public app URL or the local development URL.
 */
export const getBaseUrl = () => {
  if (Env.NEXT_PUBLIC_APP_URL) {
    return Env.NEXT_PUBLIC_APP_URL;
  }

  return 'http://localhost:3000';
};

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

const REDIRECT_BASE = 'http://localhost';

/**
 * Restricts a user-supplied redirect target to a path on this site to prevent open redirects.
 * @param path The untrusted path, e.g. a `next` query parameter.
 * @param fallback The path to use when `path` is missing or points elsewhere.
 * @returns A same-origin path including its query string and hash.
 */
export const getSafeRedirectPath = (path: string | null | undefined, fallback: string) => {
  if (!path?.startsWith('/')) {
    return fallback;
  }

  // The URL parser normalizes `\`, tabs and newlines the same way browsers do.
  const url = URL.parse(path, REDIRECT_BASE);

  if (url?.origin !== REDIRECT_BASE) {
    return fallback;
  }

  return `${url.pathname}${url.search}${url.hash}`;
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
