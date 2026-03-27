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
 */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

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
// Minimal hook runner (node env, no @testing-library/react-native)
// ---------------------------------------------------------------------------

import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { useRouteActions } from '../use-route-actions'

type HookResult = ReturnType<typeof useRouteActions>

function createHookRunner(savedRouteId: string | null) {
  const ref: { current: HookResult | null } = { current: null }

  function TestComponent() {
    ref.current = useRouteActions(savedRouteId)
    return null
  }

  let renderer: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent))
  })

  return {
    get result() {
      return ref.current!
    },
    unmount: () => {
      act(() => {
        renderer.unmount()
      })
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRouteActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes with dialogs closed', () => {
    const hook = createHookRunner('route_123')
    expect(hook.result.renameDialogVisible).toBe(false)
    expect(hook.result.deleteDialogVisible).toBe(false)
    hook.unmount()
  })

  // AC1: Rename dialog opens
  it('opens rename dialog', () => {
    const hook = createHookRunner('route_123')
    act(() => { hook.result.openRenameDialog() })
    expect(hook.result.renameDialogVisible).toBe(true)
    hook.unmount()
  })

  // AC2: Rename saves and closes dialog
  it('calls rename mutation and closes dialog on success', async () => {
    const hook = createHookRunner('route_123')

    act(() => { hook.result.openRenameDialog() })
    expect(hook.result.renameDialogVisible).toBe(true)

    await act(async () => {
      await hook.result.handleRename('New Route Name')
    })

    expect(mockRenameRun).toHaveBeenCalledWith({
      savedRouteId: 'route_123',
      name: 'New Route Name',
    })
    expect(hook.result.renameDialogVisible).toBe(false)
    hook.unmount()
  })

  // AC3: Delete dialog opens
  it('opens delete dialog', () => {
    const hook = createHookRunner('route_123')
    act(() => { hook.result.openDeleteDialog() })
    expect(hook.result.deleteDialogVisible).toBe(true)
    hook.unmount()
  })

  // AC4: Delete confirm triggers soft delete + undo toast
  it('calls soft delete and shows undo toast on confirm', async () => {
    const hook = createHookRunner('route_123')

    act(() => { hook.result.openDeleteDialog() })

    await act(async () => {
      await hook.result.handleDeleteConfirm()
    })

    expect(mockSoftDeleteRun).toHaveBeenCalledWith({
      savedRouteId: 'route_123',
    })
    expect(hook.result.deleteDialogVisible).toBe(false)
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Route deleted',
        description: 'Tap to undo.',
        duration: 5000,
      })
    )
    hook.unmount()
  })

  // AC5: Undo restores the route
  it('calls undo mutation when undo toast is tapped', async () => {
    const hook = createHookRunner('route_123')

    await act(async () => {
      await hook.result.handleDeleteConfirm()
    })

    const notifConfig = mockShowNotification.mock.calls[0][0]
    expect(notifConfig.onPress).toBeDefined()

    await act(async () => {
      await notifConfig.onPress()
    })

    expect(mockUndoDeleteRun).toHaveBeenCalledWith({
      savedRouteId: 'route_123',
    })
    expect(mockHideNotification).toHaveBeenCalled()
    hook.unmount()
  })

  // AC6: onHidden navigates back when undo was NOT tapped
  it('navigates back when toast is dismissed without undo', async () => {
    const hook = createHookRunner('route_123')

    await act(async () => {
      await hook.result.handleDeleteConfirm()
    })

    const notifConfig = mockShowNotification.mock.calls[0][0]
    expect(notifConfig.onHidden).toBeDefined()

    act(() => {
      notifConfig.onHidden()
    })

    expect(mockBack).toHaveBeenCalled()
    hook.unmount()
  })

  it('does NOT navigate back if undo was tapped', async () => {
    const hook = createHookRunner('route_123')

    await act(async () => {
      await hook.result.handleDeleteConfirm()
    })

    const notifConfig = mockShowNotification.mock.calls[0][0]

    // Tap undo first
    await act(async () => {
      await notifConfig.onPress()
    })

    // Then onHidden fires (toast dismissed after undo)
    act(() => {
      notifConfig.onHidden()
    })

    expect(mockBack).not.toHaveBeenCalled()
    hook.unmount()
  })

  it('does nothing when savedRouteId is null', async () => {
    const hook = createHookRunner(null)

    await act(async () => {
      await hook.result.handleRename('test')
    })
    expect(mockRenameRun).not.toHaveBeenCalled()

    await act(async () => {
      await hook.result.handleDeleteConfirm()
    })
    expect(mockSoftDeleteRun).not.toHaveBeenCalled()
    hook.unmount()
  })
})
