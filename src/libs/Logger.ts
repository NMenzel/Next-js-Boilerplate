import { configure, getConsoleSink, getJsonLinesFormatter, getLogger } from '@logtape/logtape';
import { redactByField } from '@logtape/redaction';
import { Env } from './Env';

// Structured JSON lines on stdout; no remote forwarding. Fields that look like passwords,
// tokens, keys, auth data, emails or addresses are removed as a safety net. Still log codes, not payloads.
await configure({
  sinks: {
    console: redactByField(getConsoleSink({ formatter: getJsonLinesFormatter() })),
  },
  loggers: [
    {
      category: ['logtape', 'meta'],
      sinks: ['console'],
      lowestLevel: 'warning',
    },
    {
      category: ['app'],
      sinks: ['console'],
      lowestLevel: Env.NEXT_PUBLIC_LOGGING_LEVEL,
    },
  ],
});

export const logger = getLogger(['app']);
