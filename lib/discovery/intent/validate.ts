/**
 * Valid archetype values.
 */
export const VALID_ARCHETYPES = [
  'twisties',
  'mountain',
  'coastal',
  'adventure',
  'scenic_byway',
  'desert',
] as const;

/**
 * Valid state values (2-letter US state codes).
 */
export const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

/**
 * Intent parameters returned by Haiku.
 */
export interface IntentParams {
  archetypes?: string[];
  states?: string[];
  minDistance?: number;
  maxDistance?: number;
  keywords?: string[];
}

/**
 * Validate and filter intent parameters.
 * Removes any hallucinated archetype or state values that aren't in the valid enums.
 */
export function validateEnums(params: IntentParams): IntentParams {
  const validated: IntentParams = {};

  // Filter archetypes to valid values only
  if (params.archetypes && params.archetypes.length > 0) {
    validated.archetypes = params.archetypes.filter(a =>
      VALID_ARCHETYPES.includes(a as any)
    );
  }

  // Filter states to valid values only
  if (params.states && params.states.length > 0) {
    validated.states = params.states.filter(s =>
      VALID_STATES.includes(s as any)
    );
  }

  // Copy other fields as-is
  if (params.minDistance !== undefined) {
    validated.minDistance = params.minDistance;
  }
  if (params.maxDistance !== undefined) {
    validated.maxDistance = params.maxDistance;
  }
  if (params.keywords && params.keywords.length > 0) {
    validated.keywords = params.keywords;
  }

  return validated;
}
