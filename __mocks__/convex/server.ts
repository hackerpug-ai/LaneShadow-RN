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

