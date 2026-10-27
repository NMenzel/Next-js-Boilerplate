import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { Env } from './src/libs/Env';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  // Only directives that cannot break Next.js or Supabase. A script/style CSP needs per-request
  // nonces (which forces dynamic rendering) and is deferred; see docs/architecture.md.
  {
    key: 'Content-Security-Policy',
    value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  },
];

const baseConfig: NextConfig = {
  // Keep AGENTS.md hand-maintained; `next dev` would otherwise inject a managed block for AI agents.
  agentRules: false,
  devIndicators: {
    position: 'bottom-right',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  // React Compiler runs in production builds only to keep `next dev` fast; E2E tests use the compiled build.
  reactCompiler: Env.NODE_ENV === 'production',
  experimental: {
    // Clean up unused compilation work from memory and disk caches.
    turbopackGc: true,
    // Use the Rust version, instead of the OG Babel one
    turbopackRustReactCompiler: Env.NODE_ENV === 'production',
  },
  logging: {
    browserToTerminal: true,
  },
  // oxlint-disable-next-line require-await -- Next.js expects headers() to return a Promise
  headers: async () => [{ source: '/:path*', headers: securityHeaders }],
};

const configWithIntl = createNextIntlPlugin('./src/libs/I18n.ts')(baseConfig);

// Sentry is optional: the build plugin is only added when a DSN is configured, and source maps
// are only generated and uploaded (then deleted from the build output) when an auth token exists.
const nextConfig = Env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(configWithIntl, {
      org: Env.SENTRY_ORG,
      project: Env.SENTRY_PROJECT,
      authToken: Env.SENTRY_AUTH_TOKEN,
      sourcemaps: { disable: !Env.SENTRY_AUTH_TOKEN },
      silent: !Env.CI,
      widenClientFileUpload: true,
      telemetry: false,
    })
  : configWithIntl;

export default nextConfig;
