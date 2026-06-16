const STOP_WORDS = [
  'i want to',
  'show me',
  'find me',
  'some',
  'a',
  'the',
  'please',
  'rides',
  'roads',
  'routes',
  'want',
  'need',
  'looking for',
  'search',
]

/**
 * Normalize an intent string for cache lookup.
 * Converts to lowercase, strips stopwords, collapses whitespace.
 */
export function normalizeIntent(raw: string): string {
  let s = raw.toLowerCase().trim()

  // Remove stop words
  for (const word of STOP_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'g')
    s = s.replace(regex, '')
  }

  // Collapse multiple spaces into one and trim
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * Current schema version for intent cache.
 * Increment this when the Haiku prompt schema changes.
 */
export const CURRENT_SCHEMA_VERSION = 1
