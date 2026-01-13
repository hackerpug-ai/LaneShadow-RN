export const v = {
  string: () => ({ kind: 'string' }),
  number: () => ({ kind: 'number' }),
  boolean: () => ({ kind: 'boolean' }),
  null: () => ({ kind: 'null' }),
  int64: () => ({ kind: 'int64' }),
  bytes: () => ({ kind: 'bytes' }),
  id: (tableName: string) => ({ kind: 'id', tableName }),
  optional: (value: unknown) => ({ kind: 'optional', value }),
  array: (value: unknown) => ({ kind: 'array', value }),
  object: (shape: unknown) => ({ kind: 'object', shape }),
  record: (key: unknown, value: unknown) => ({ kind: 'record', key, value }),
  union: (...values: Array<unknown>) => ({ kind: 'union', values }),
  literal: (value: unknown) => ({ kind: 'literal', value }),
} as const

