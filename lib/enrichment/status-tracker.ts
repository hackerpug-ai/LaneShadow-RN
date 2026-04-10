/**
 * Pure functions for enrichment status tracking and progress calculation.
 *
 * LOCAL phase: draft → partial over ~350ms (progress 0→50%)
 * CLOUD phase: partial → complete over ~3.9s (progress 50→100%)
 */

export type EnrichmentStatus = 'draft' | 'partial' | 'complete' | 'error';

/** Duration in milliseconds for each enrichment phase */
export const LOCAL_PHASE_DURATION_MS = 350;
export const CLOUD_PHASE_DURATION_MS = 3900;

/**
 * Calculate progress percentage (0–100) based on current status
 * and how long the current phase has been running.
 */
export function calculateProgress(
  status: EnrichmentStatus,
  phaseStartTime: number | null,
  nowMs: number = Date.now(),
): number {
  if (status === 'draft') return 0;
  if (status === 'complete') return 100;
  if (status === 'error') return 50;

  if (!phaseStartTime) return 0;

  const elapsed = nowMs - phaseStartTime;

  if (status === 'partial') {
    const fraction = Math.min(elapsed / CLOUD_PHASE_DURATION_MS, 1);
    return Math.round(50 + fraction * 50);
  }

  return 0;
}

/**
 * Estimate seconds remaining for the current enrichment phase.
 */
export function estimateTimeRemaining(
  status: EnrichmentStatus,
  phaseStartTime: number | null,
  nowMs: number = Date.now(),
): number {
  if (status === 'complete' || status === 'draft' || status === 'error') return 0;
  if (!phaseStartTime) return 0;

  const elapsed = nowMs - phaseStartTime;

  if (status === 'partial') {
    const remaining = Math.max(CLOUD_PHASE_DURATION_MS - elapsed, 0);
    return Math.round(remaining / 1000);
  }

  return 0;
}

/**
 * Determine the next enrichment status given the current status and a model result.
 */
export function getNextStatus(
  currentStatus: EnrichmentStatus,
  modelResult: 'success' | 'error' | 'partial',
): EnrichmentStatus {
  if (modelResult === 'error') return 'error';

  switch (currentStatus) {
    case 'draft':
      return 'partial';
    case 'partial':
      return modelResult === 'success' ? 'complete' : 'partial';
    case 'complete':
      return 'complete';
    case 'error':
      return modelResult === 'success' ? 'complete' : 'error';
    default:
      return currentStatus;
  }
}
