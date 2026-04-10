import { describe, expect, it } from 'vitest';
import { shouldShowToast, getToastMessage } from '../toast-notifications';

describe('shouldShowToast', () => {
  it('returns true when transitioning to complete from partial', () => {
    expect(shouldShowToast('partial', 'complete')).toBe(true);
  });

  it('returns false when already complete', () => {
    expect(shouldShowToast('complete', 'complete')).toBe(false);
  });

  it('returns false for transition to partial', () => {
    expect(shouldShowToast('draft', 'partial')).toBe(false);
  });

  it('returns false for transition to error', () => {
    expect(shouldShowToast('partial', 'error')).toBe(false);
  });
});

describe('getToastMessage', () => {
  it('returns success message for complete', () => {
    expect(getToastMessage('complete')).toBe('Route enhancement complete');
  });

  it('returns error message for error', () => {
    expect(getToastMessage('error')).toBe('Enhancement failed');
  });

  it('returns null for draft', () => {
    expect(getToastMessage('draft')).toBeNull();
  });

  it('returns null for partial', () => {
    expect(getToastMessage('partial')).toBeNull();
  });
});
