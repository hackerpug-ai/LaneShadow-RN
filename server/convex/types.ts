/**
 * Type-safe helpers for Convex vector search
 *
 * In Convex 1.34.1, vectorSearch is only typed on GenericActionCtx,
 * but it's actually available on GenericQueryCtx as well.
 * This module provides type-safe wrappers to work around this limitation.
 */

import type { GenericQueryCtx } from 'convex/server'
import type { DataModel, Id, TableNames } from './_generated/dataModel'

/**
 * Extended QueryCtx type that includes vectorSearch
 *
 * This represents the actual runtime capability of QueryCtx in Convex 1.34.1,
 * where vectorSearch is available but not properly typed.
 */
interface QueryCtxWithVectorSearch extends GenericQueryCtx<DataModel> {
  vectorSearch<TableName extends TableNames>(
    tableName: TableName,
    indexName: string,
    query: {
      vector: number[]
      limit?: number
      filter?: any
    },
  ): Promise<Array<{ _id: Id<TableName>; _score: number }>>
}

/**
 * Type-safe assertion that QueryCtx supports vectorSearch
 *
 * This function provides a more type-safe alternative to `(ctx as any).vectorSearch`.
 * It preserves the actual ctx type while adding vectorSearch capability.
 *
 * @param ctx - The QueryCtx from a query function
 * @returns The same ctx with vectorSearch properly typed
 */
export function withVectorSearch(ctx: GenericQueryCtx<DataModel>): QueryCtxWithVectorSearch {
  return ctx as QueryCtxWithVectorSearch
}
