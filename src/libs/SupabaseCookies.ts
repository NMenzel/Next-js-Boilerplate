import type { CookieOptionsWithName } from '@supabase/ssr';
import { Env } from './Env';

/**
 * Session cookie options for every Supabase client (proxy, Server Components, Server Actions).
 * Only the server reads the session, so scripts cannot (`httpOnly`), and HTTPS deployments never
 * send it over plain HTTP (`secure`). Add a browser client only after removing `httpOnly`.
 */
export const supabaseCookieOptions = {
  httpOnly: true,
  secure: Env.NEXT_PUBLIC_APP_URL.startsWith('https://'),
} satisfies CookieOptionsWithName;
