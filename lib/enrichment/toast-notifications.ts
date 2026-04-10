/**
 * Pure functions for enrichment toast notification logic.
 */

import type { EnrichmentStatus } from './status-tracker';

/**
 * Determine whether a toast should be shown for a status transition.
 * Only shows toast when transitioning TO 'complete' from a non-complete status.
 */
export function shouldShowToast(
  oldStatus: EnrichmentStatus,
  newStatus: EnrichmentStatus,
): boolean {
  return newStatus === 'complete' && oldStatus !== 'complete';
}

/**
 * Get the toast message for a given enrichment status.
 */
export function getToastMessage(status: EnrichmentStatus): string | null {
  switch (status) {
    case 'complete':
      return 'Route enhancement complete';
    case 'error':
      return 'Enhancement failed';
    default:
      return null;
  }
}
