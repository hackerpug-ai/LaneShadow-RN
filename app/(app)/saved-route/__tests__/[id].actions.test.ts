/**
 * Tests for route detail screen actions (rename, delete, undo).
 *
 * Validates:
 * - AC1: Rename dialog opens with current name
 * - AC2: Rename saves and closes dialog
 * - AC3: Delete dialog opens with route name
 * - AC4: Delete confirm triggers soft delete + undo toast
 * - AC5: Undo restores the route
 * - AC6: Timer expiry navigates back
 *
 * Strategy: Mocks React hooks at module level and calls the hook as a
 * plain function. This avoids needing a React rendering environment
 * (react-test-renderer is broken in React 19, no jsdom available).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// React hook mocks — simulate useState, useCallback, useRef
// ---------------------------------------------------------------------------

const stateStore = new Map<number, any>()
let stateCounter = 0

function resetStateStore() {
  stateStore.clear()
  stateCounter = 0
}

jest.mock('react', () => {
  const actualReact = jest.requireActual('react')
  return {
    ...actualReact,
    useState: (initial: any) => {
      const idx = stateCounter++
      if (!stateStore.has(idx)) {
        stateStore.set(idx, initial)
      }
      const setter = (val: any) => {
        const newVal = typeof val === 'function' ? val(stateStore.get(idx)) : val
        stateStore.set(idx, newVal)
      }
      return [stateStore.get(idx), setter]
    },
    useCallback: (fn: any, _deps: any) => fn,
    useRef: (initial: any) => {
      const idx = stateCounter++
      if (!stateStore.has(idx)) {
        stateStore.set(idx, { current: initial })
      }
      return stateStore.get(idx)
    },
  }
})

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}))

const mockRenameRun = jest.fn().mockResolvedValue(null)
const mockSoftDeleteRun = jest.fn().mockResolvedValue({ scheduledDeletionId: 'sched_123' })
const mockUndoDeleteRun = jest.fn().mockResolvedValue(null)

jest.mock('../../../../hooks/use-saved-routes', () => ({
  useRenameRoute: () => ({
    run: mockRenameRun,
    isRunning: false,
    error: null,
    resetError: jest.fn(),
  }),
  useSoftDeleteRoute: () => ({
    run: mockSoftDeleteRun,
    isRunning: false,
    error: null,
    resetError: jest.fn(),
  }),
  useUndoDeleteRoute: () => ({
    run: mockUndoDeleteRun,
    isRunning: false,
    error: null,
    resetError: jest.fn(),
  }),
}))

const mockShowNotification = jest.fn()
const mockHideNotification = jest.fn()
jest.mock('react-native-notifier', () => ({
  Notifier: {
    showNotification: (...args: unknown[]) => mockShowNotification(...args),
    hideNotification: (...args: unknown[]) => mockHideNotification(...args),
  },
}))

jest.mock('../../../../lib/notifier-helpers', () => ({
  showSuccessNotification: jest.fn(),
  showErrorNotification: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useRouteActions } from '../use-route-actions'

/**
 * Call the hook as a plain function. Because React hooks are mocked,
 * this works without a React rendering context. The stateCounter must
 * be reset between calls to re-read state correctly.
 */
function callHook(savedRouteId: string | null) {
  stateCounter = 0
  return useRouteActions(savedRouteId)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRouteActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStateStore()
  })

  it('initializes with dialogs closed', () => {
    const result = callHook('route_123')
    expect(result.renameDialogVisible).toBe(false)
    expect(result.deleteDialogVisible).toBe(false)
  })

  // AC1: Rename dialog opens
  it('opens rename dialog', () => {
    let result = callHook('route_123')
    result.openRenameDialog()
    result = callHook('route_123')
    expect(result.renameDialogVisible).toBe(true)
  })

  // AC2: Rename saves and closes dialog
  it('calls rename mutation and closes dialog on success', async () => {
    let result = callHook('route_123')
    result.openRenameDialog()
    result = callHook('route_123')
    expect(result.renameDialogVisible).toBe(true)

    await result.handleRename('New Route Name')

    expect(mockRenameRun).toHaveBeenCalledWith({
      savedRouteId: 'route_123',
      name: 'New Route Name',
    })

    result = callHook('route_123')
    expect(result.renameDialogVisible).toBe(false)
  })

  // AC3: Delete dialog opens
  it('opens delete dialog', () => {
    let result = callHook('route_123')
    result.openDeleteDialog()
    result = callHook('route_123')
    expect(result.deleteDialogVisible).toBe(true)
  })

  // AC4: Delete confirm triggers soft delete + undo toast
  it('calls soft delete and shows undo toast on confirm', async () => {
    let result = callHook('route_123')
    result.openDeleteDialog()
    result = callHook('route_123')

    await result.handleDeleteConfirm()

    expect(mockSoftDeleteRun).toHaveBeenCalledWith({
      savedRouteId: 'route_123',
    })

    result = callHook('route_123')
    expect(result.deleteDialogVisible).toBe(false)

    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Route deleted',
        description: 'Tap to undo.',
        duration: 5000,
      })
    )
  })

  // AC5: Undo restores the route
  it('calls undo mutation when undo toast is tapped', async () => {
    const result = callHook('route_123')

    await result.handleDeleteConfirm()

    const notifConfig = mockShowNotification.mock.calls[0][0]
    expect(notifConfig.onPress).toBeDefined()

    await notifConfig.onPress()

    expect(mockUndoDeleteRun).toHaveBeenCalledWith({
      savedRouteId: 'route_123',
    })
    expect(mockHideNotification).toHaveBeenCalled()
  })

  // AC6: onHidden navigates back when undo was NOT tapped
  it('navigates back when toast is dismissed without undo', async () => {
    const result = callHook('route_123')

    await result.handleDeleteConfirm()

    const notifConfig = mockShowNotification.mock.calls[0][0]
    expect(notifConfig.onHidden).toBeDefined()

    notifConfig.onHidden()

    expect(mockBack).toHaveBeenCalled()
  })

  it('does NOT navigate back if undo was tapped', async () => {
    const result = callHook('route_123')

    await result.handleDeleteConfirm()

    const notifConfig = mockShowNotification.mock.calls[0][0]

    // Tap undo first
    await notifConfig.onPress()

    // Then onHidden fires (toast dismissed after undo)
    notifConfig.onHidden()

    expect(mockBack).not.toHaveBeenCalled()
  })

  it('does nothing when savedRouteId is null', async () => {
    const result = callHook(null)

    await result.handleRename('test')
    expect(mockRenameRun).not.toHaveBeenCalled()

    await result.handleDeleteConfirm()
    expect(mockSoftDeleteRun).not.toHaveBeenCalled()
  })
})
