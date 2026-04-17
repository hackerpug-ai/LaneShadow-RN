export type Id<TableName extends string> = string & { __tableName?: TableName }

export type MutationCtx = {
  db: any
  storage?: any
  auth?: any
}

export type QueryCtx = {
  db: any
  storage?: any
  auth?: any
}

export type ActionCtx = {
  runQuery?: any
  runMutation?: any
  runAction?: any
}

type FunctionConfig = {
  args?: unknown
  returns?: unknown
  handler: (...args: any[]) => any
}

export const query = (config: FunctionConfig) => config
export const mutation = (config: FunctionConfig) => config
export const action = (config: FunctionConfig) => config
export const internalQuery = (config: FunctionConfig) => config
export const internalMutation = (config: FunctionConfig) => config
export const internalAction = (config: FunctionConfig) => config

export const httpAction = (handler: any) => handler

// Minimal stubs for other Convex server helpers some modules may import in tests.
export const httpRouter = () => ({
  route: () => undefined,
})

export const cronJobs = () => ({
  interval: () => undefined,
  cron: () => undefined,
})

// Schema stubs for testing - tracks table and index definitions
const schemaTables: Record<
  string,
  { tableName: string; indexes: { indexDescriptor: string; fields: string[] }[] }
> = {}

export const defineTable = (validator: any) => {
  const indexes: { indexDescriptor: string; fields: string[] }[] = []

  const builder = {
    index: (name: string, fields: string[]) => {
      indexes.push({ indexDescriptor: name, fields })
      return builder
    },
  }

  // Store reference to add to schema later
  ;(builder as any)._indexes = indexes

  return builder
}

export const defineSchema = (tables: Record<string, any>) => {
  // Process the fluent API table definitions
  for (const [tableName, tableBuilder] of Object.entries(tables)) {
    const indexes = (tableBuilder as any)._indexes || []
    schemaTables[tableName] = {
      tableName,
      indexes,
    }
  }

  return {
    tables: schemaTables,
  }
}

