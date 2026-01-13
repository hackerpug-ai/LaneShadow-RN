/**
 * Shared TypeScript types for the application
 * Add domain-specific types here as the app grows
 */

/**
 * Common utility types
 */
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

/**
 * Result type for operations that can fail
 * Follows functional programming patterns per coding standards
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark'

/**
 * Re-export schema types for convenience
 */
/**
 * Barrel export for all shared types
 * All types are inferred from Convex schema for single source of truth
 */

/**
 * Re-export theme types for convenience
 */
export type {
  ColorState,
  ExtendedTheme,
  FontWeight,
  SemanticColors,
  SemanticColorSet,
  SemanticElevation,
  SemanticRadius,
  SemanticSpacing,
  SemanticTheme,
  SemanticTypography,
  ShadowStyle,
  TypographyStyle,
} from '../styles/types'

export type {
  RouteSketch,
  RouteSketchAnchorPoint,
  RouteSketchSegment,
} from '../models/route-sketch'

export * from './routes'
