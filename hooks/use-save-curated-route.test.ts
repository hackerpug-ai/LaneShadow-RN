/**
 * SAVE-001: useSaveCuratedRoute / useIsCuratedRouteSaved / useUnsaveCuratedRoute
 *
 * jsdom-testable LOGIC for the curated save/restore/toggle flow.
 *
 * AC-1 (PRIMARY): save() persists via curatedRouteRef (planInput absent — XOR),
 *                 AND fires recordRouteFeedback('save').
 * AC-4:           unsave() invokes the saved_routes removal mutation.
 *
 * Convex is mocked at the convex/react boundary (useMutation / useQuery) — the
 * assertions verify WHICH mutation ran and WITH WHICH args, not Convex internals.
 * The live save/feedback run against real Convex in the PHASE 3.5 Maestro flow.
 */

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — defined BEFORE the hook import so vi.mock hoists correctly.
// ---------------------------------------------------------------------------

// useMutation returns a fresh spy per call. Call ORDER identifies the mutation:
//   hook body calls useMutation(saveRoute) FIRST, useMutation(recordFeedback) SECOND.
// We expose the spies via `mutationSpies` so tests can assert call args.
//
// vi.hoisted() makes these refs available inside the hoisted vi.mock factory.
const { mutationSpies, mockedUseMutation, defaultUseMutationImpl } = vi.hoisted(() => {
  const mutationSpies: ReturnType<typeof vi.fn>[] = []
  const defaultUseMutationImpl = () => {
    const spy = vi.fn()
    mutationSpies.push(spy)
    return spy
  }
  const mockedUseMutation = vi.fn(defaultUseMutationImpl)
  return { mutationSpies, mockedUseMutation, defaultUseMutationImpl }
})

vi.mock('convex/react', () => ({
  useMutation: mockedUseMutation,
  useQuery: vi.fn((_ref: unknown, _args: unknown) => mockQueryReturn),
}))

// Configurable query return for useIsCuratedRouteSaved.
let mockQueryReturn: unknown

vi.mock('../lib/notifier-helpers', () => ({
  showSuccessNotification: vi.fn(),
  showErrorNotification: vi.fn(),
}))

vi.mock('../lib/convex-error', () => ({
  getUserFacingError: (e: unknown) => ({ message: String(e) }),
}))

// ---------------------------------------------------------------------------

import {
  useIsCuratedRouteSaved,
  useSaveCuratedRoute,
  useUnsaveCuratedRoute,
} from './use-save-curated-route'

describe('SAVE-001 / AC-1: useSaveCuratedRoute', () => {
  beforeEach(() => {
    mutationSpies.length = 0
    mockQueryReturn = undefined
    vi.clearAllMocks()
  })

  it('save() calls saveRoute with {curatedRouteRef, name} and NO plan payload (XOR)', async () => {
    const { result } = renderHook(() =>
      useSaveCuratedRoute({ curatedRouteId: 'k123', name: 'Wasatch Ridge Loop' }),
    )

    // mutationSpies[0] = saveRoute (first useMutation call in hook body)
    const saveRouteSpy = mutationSpies[0]
    expect(saveRouteSpy, 'saveRoute mutation must be acquired').toBeDefined()

    // mutationSpies[1] = recordRouteFeedback (second useMutation call)
    const feedbackSpy = mutationSpies[1]
    expect(feedbackSpy, 'recordRouteFeedback mutation must be acquired').toBeDefined()

    await act(async () => {
      await result.current.save()
    })

    // ── must observe: saveRoute called with curatedRouteRef + name ──
    expect(saveRouteSpy).toHaveBeenCalledTimes(1)
    const saveArgs = saveRouteSpy.mock.calls[0][0] as Record<string, unknown>
    expect(saveArgs.curatedRouteRef).toBe('k123')
    expect(saveArgs.name).toBe('Wasatch Ridge Loop')

    // ── must NOT observe: any planned payload (DATA-003 XOR) ──
    expect(saveArgs.planInput).toBeUndefined()
    expect(saveArgs.routeSnapshot).toBeUndefined()
    expect(saveArgs.routeIndex).toBeUndefined()
  })

  it('save() fires recordRouteFeedback({routeId, action:"save"}) AFTER the save', async () => {
    const { result } = renderHook(() =>
      useSaveCuratedRoute({ curatedRouteId: 'k456', name: 'Alpine Loop' }),
    )

    const saveRouteSpy = mutationSpies[0]
    const feedbackSpy = mutationSpies[1]

    await act(async () => {
      await result.current.save()
    })

    // save must run first
    expect(saveRouteSpy).toHaveBeenCalledTimes(1)
    // feedback must fire with the curated id + 'save' action
    expect(feedbackSpy).toHaveBeenCalledTimes(1)
    const feedbackArgs = feedbackSpy.mock.calls[0][0] as Record<string, unknown>
    expect(feedbackArgs.routeId).toBe('k456')
    expect(feedbackArgs.action).toBe('save')
  })

  it('returns isLoading=true while save is in flight, false after', async () => {
    // Reconfigure the mocked useMutation so its returned spy resolves on demand,
    // letting us observe the in-flight loading state.
    let releaseSave: () => void = () => {}
    const pendingSave = new Promise<{ savedRouteId: string }>((resolve) => {
      releaseSave = () => resolve({ savedRouteId: 'sr-1' })
    })
    mutationSpies.length = 0
    mockedUseMutation.mockImplementation(() => {
      const spy = vi.fn(() => pendingSave)
      mutationSpies.push(spy)
      return spy
    })

    const { result } = renderHook(() =>
      useSaveCuratedRoute({ curatedRouteId: 'k789', name: 'Test' }),
    )

    let done: Promise<unknown> = Promise.resolve()
    await act(async () => {
      done = result.current.save()
    })

    // While pending, isLoading should be true
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      releaseSave()
      await done
    })

    expect(result.current.isLoading).toBe(false)

    // Restore the default spy factory for subsequent tests.
    mockedUseMutation.mockImplementation(defaultUseMutationImpl)
  })
})

describe('SAVE-001 / AC-4: useUnsaveCuratedRoute', () => {
  beforeEach(() => {
    mutationSpies.length = 0
    mockQueryReturn = undefined
    vi.clearAllMocks()
  })

  it('unsave() invokes the saved_routes removal mutation with the savedRouteId', async () => {
    const { result } = renderHook(() => useUnsaveCuratedRoute())

    // mutationSpies[0] = softDeleteRoute (the only useMutation in this hook)
    const removeSpy = mutationSpies[0]
    expect(removeSpy, 'removal mutation must be acquired').toBeDefined()

    await act(async () => {
      await result.current.unsave('sr-abc-123')
    })

    expect(removeSpy).toHaveBeenCalledTimes(1)
    const args = removeSpy.mock.calls[0][0] as Record<string, unknown>
    expect(args.savedRouteId).toBe('sr-abc-123')
  })
})

describe('SAVE-001: useIsCuratedRouteSaved — detection logic', () => {
  beforeEach(() => {
    mutationSpies.length = 0
    mockQueryReturn = undefined
    vi.clearAllMocks()
  })

  it('returns isSaved=false while the list is loading (undefined)', () => {
    mockQueryReturn = undefined
    const { result } = renderHook(() => useIsCuratedRouteSaved({ curatedRouteId: 'k123' }))
    expect(result.current.isSaved).toBe(false)
    expect(result.current.savedRouteId).toBeUndefined()
  })

  it('returns isSaved=false when curatedRouteId is absent', () => {
    mockQueryReturn = { routes: [] }
    const { result } = renderHook(() => useIsCuratedRouteSaved({ curatedRouteId: null }))
    expect(result.current.isSaved).toBe(false)
  })

  it('detects a matching curated row and exposes its savedRouteId', () => {
    // Simulate the (extended) read path returning a curated-shape row.
    mockQueryReturn = {
      routes: [
        {
          savedRouteId: 'sr-1',
          name: 'Wasatch Ridge Loop',
          curatedRouteRef: 'k123',
        },
        {
          savedRouteId: 'sr-2',
          name: 'Other',
          curatedRouteRef: 'k999',
        },
      ],
    }
    const { result } = renderHook(() => useIsCuratedRouteSaved({ curatedRouteId: 'k123' }))
    expect(result.current.isSaved).toBe(true)
    expect(result.current.savedRouteId).toBe('sr-1')
  })

  it('returns isSaved=false when no curated row matches', () => {
    mockQueryReturn = {
      routes: [{ savedRouteId: 'sr-2', curatedRouteRef: 'k999' }],
    }
    const { result } = renderHook(() => useIsCuratedRouteSaved({ curatedRouteId: 'k123' }))
    expect(result.current.isSaved).toBe(false)
    expect(result.current.savedRouteId).toBeUndefined()
  })
})
