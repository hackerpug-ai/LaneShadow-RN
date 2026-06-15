/**
 * Type declarations for @convex-dev/geospatial
 *
 * This file provides TypeScript type declarations for the @convex-dev/geospatial package
 * to resolve module resolution errors during development.
 */

declare module '@convex-dev/geospatial' {
  import { ComponentApi } from 'convex/server'

  export interface GeospatialIndexOptions<TFilterKeys = Record<string, any>> {
    geospatialField?: string
    fullTextSearchField?: string
    filterKeys?: TFilterKeys
  }

  export interface NearestOptions {
    point: {
      latitude: number
      longitude: number
    }
    limit?: number
    maxDistance?: number
    filterKeys?: Record<string, any>
  }

  export interface QueryOptions {
    shape: {
      type: 'rectangle' | 'circle'
      rectangle?: {
        west: number
        south: number
        east: number
        north: number
      }
      circle?: {
        center: {
          latitude: number
          longitude: number
        }
        radiusMeters: number
      }
    }
    limit?: number
    filterKeys?: Record<string, any>
  }

  export class GeospatialIndex<T = string, TFilterKeys = Record<string, any>> {
    constructor(component: ComponentApi<string>, options?: GeospatialIndexOptions<TFilterKeys>)

    nearest(ctx: any, options: NearestOptions): Promise<Array<{ _id: T; _score: number }>>

    query(
      ctx: any,
      options: QueryOptions,
    ): Promise<{
      results: Array<{ _id: T; _score: number }>
      nextCursor?: string
    }>

    insert(
      ctx: any,
      id: T,
      coordinates: { latitude: number; longitude: number },
      filterKeys?: TFilterKeys,
      sortKey?: number,
    ): Promise<void>

    remove(ctx: any, id: T): Promise<void>
  }
}

declare module '@convex-dev/geospatial/convex.config' {
  const geospatialComponent: any
  export default geospatialComponent
}

declare module '@convex-dev/geospatial/_generated/component.js' {
  export type ComponentApi<T extends string> = any
}

declare module '@mapbox/polyline' {
  function decode(str: string, precision?: number): [number, number][]
  function encode(coordinates: [number, number][], precision?: number): string
  function toGeoJSON(
    str: string,
    precision?: number,
  ): { type: 'LineString'; coordinates: number[][] }

  export { decode, encode, toGeoJSON }

  const polyline: { decode: typeof decode; encode: typeof encode; toGeoJSON: typeof toGeoJSON }
  export default polyline
}
