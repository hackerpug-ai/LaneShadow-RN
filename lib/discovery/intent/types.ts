/**
 * Spot type returned by queries.
 */
export interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  archetype: string;
  composite_score: number;
}

/**
 * Intent search state.
 */
export type IntentSearchState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'ok'; routes: Spot[]; params: ValidatedIntentParams; source: 'cache' | 'haiku' }
  | { status: 'offline_unsupported'; recentIntents: string[] };

/**
 * Raw intent parameters (may contain hallucinated values).
 */
export interface IntentParams {
  archetypes?: string[];
  states?: string[];
  minDistance?: number;
  maxDistance?: number;
  keywords?: string[];
}

/**
 * Validated intent parameters (enum values filtered).
 */
export interface ValidatedIntentParams extends IntentParams {
  archetypes?: string[];
  states?: string[];
}
