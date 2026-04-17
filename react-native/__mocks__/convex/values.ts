export const v = {
  string: () => ({ kind: 'string', isOptional: 'required' }),
  number: () => ({ kind: 'number', isOptional: 'required' }),
  boolean: () => ({ kind: 'boolean', isOptional: 'required' }),
  null: () => ({ kind: 'null', isOptional: 'required' }),
  int64: () => ({ kind: 'int64', isOptional: 'required' }),
  bytes: () => ({ kind: 'bytes', isOptional: 'required' }),
  id: (tableName: string) => ({ kind: 'id', tableName, isOptional: 'required' }),
  optional: (value: any) => ({ ...(value as object), isOptional: 'optional' }),
  nullable: (value: any) => ({ ...(value as object), isNullable: true }),
  array: (value: unknown) => ({ kind: 'array', element: value, isOptional: 'required' }),
  object: (shape: Record<string, unknown>) => ({ kind: 'object', fields: shape, isOptional: 'required' }),
  record: (key: unknown, value: unknown) => ({ kind: 'record', key, value, isOptional: 'required' }),
  union: (...values: unknown[]) => ({ kind: 'union', members: values, isOptional: 'required' }),
  literal: (value: unknown) => ({ kind: 'literal', value, isOptional: 'required' }),
  any: () => ({ kind: 'any', isOptional: 'required' }),
  float64: () => ({ kind: 'float64', isOptional: 'required' }),
  bigint: () => ({ kind: 'bigint', isOptional: 'required' }),
} as const

export class ConvexError<TData = string> extends Error {
  name = 'ConvexError'
  data: TData

  constructor(data: TData) {
    super(typeof data === 'string' ? data : JSON.stringify(data))
    this.data = data
  }
}

