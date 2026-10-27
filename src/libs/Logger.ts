import { configure, getConsoleSink, getJsonLinesFormatter, getLogger } from '@logtape/logtape';
import { Env } from './Env';

await configure({
  sinks: {
    console: getConsoleSink({ formatter: getJsonLinesFormatter() }),
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
