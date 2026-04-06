/**
 * Unit tests for useRideFlow state machine hook
 *
 * Acceptance Criteria:
 * - AC1: Given IDLE state, when SEND_MESSAGE dispatched with content, then transitions to PLANNING
 * - AC2: Given PLANNING state, when PLANNING_SUCCESS dispatched, then transitions to ROUTE_RESULTS
 * - AC3: Given ROUTE_RESULTS state, when NAVIGATE_EXPORT dispatched with null selectedRouteId, then transition rejected
 * - AC4: Given any state, when NEW_SESSION dispatched, then resets all state to IDLE
 * - AC5: Given IDLE state, when LOAD_SESSION dispatched, then populates routeOptions from attachment
 */

import { describe, it, expect } from 'vitest'
import { rideFlowReducer, initialState } from './use-ride-flow'
import type { PlannedRouteOptionsView } from '../types/routes'

/**
 * Helper to create mock route options matching the actual types
 */
const createMockRouteOptions = (): PlannedRouteOptionsView => ({
  planId: 'plan-123',
  options: [
    {
      routeOptionId: 'route-1',
      label: 'Scenic Route',
      rationale: 'Best views',
      stats: {
        distanceMeters: 10000,
        durationSeconds: 1800,
        legsCount: 2,
      },
      map: {
        bounds: { north: 1, south: 2, east: 3, west: 4 },
        overviewGeometry: {
          format: 'polyline',
          encoding: 'utf8',
          precision: 6,
          value: 'encoded_polyline_string',
        },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'moderate',
        rainSummary: 'light',
        temperatureSummary: 'mild',
        conditionsStatus: 'ok',
      },
    },
  ],
})

describe('useRideFlow', () => {
  describe('AC1: IDLE -> PLANNING on SEND_MESSAGE with content', () => {
    it('should transition from IDLE to PLANNING when SEND_MESSAGE is dispatched with content', () => {
      const state = initialState
      expect(state.phase).toBe('IDLE')

      const nextState = rideFlowReducer(state, {
        type: 'SEND_MESSAGE',
        content: 'Plan a ride from downtown to the airport',
      })

      expect(nextState.phase).toBe('PLANNING')
      expect(nextState.sessionId).toBeTruthy()
    })

    it('should not transition when SEND_MESSAGE has empty content', () => {
      const state = initialState
      expect(state.phase).toBe('IDLE')

      const nextState = rideFlowReducer(state, {
        type: 'SEND_MESSAGE',
        content: '',
      })

      // Should stay in IDLE (guard prevents transition)
      expect(nextState.phase).toBe('IDLE')
    })
  })

  describe('AC2: PLANNING -> ROUTE_RESULTS on PLANNING_SUCCESS', () => {
    it('should transition from PLANNING to ROUTE_RESULTS when PLANNING_SUCCESS is dispatched', () => {
      // First transition to PLANNING
      let state = rideFlowReducer(initialState, {
        type: 'SEND_MESSAGE',
        content: 'Plan a ride',
      })

      expect(state.phase).toBe('PLANNING')

      // Dispatch PLANNING_SUCCESS
      const mockRouteOptions = createMockRouteOptions()
      state = rideFlowReducer(state, {
        type: 'PLANNING_SUCCESS',
        routeOptions: mockRouteOptions,
      })

      expect(state.phase).toBe('ROUTE_RESULTS')
      if (state.phase === 'ROUTE_RESULTS') {
        expect(state.routeOptions).toEqual(mockRouteOptions)
      }
    })
  })

  describe('AC3: NAVIGATION_EXPORT rejected when selectedRouteId is null', () => {
    it('should reject NAVIGATE_EXPORT transition when selectedRouteId is null', () => {
      // Setup: Get to ROUTE_RESULTS state
      let state = rideFlowReducer(initialState, {
        type: 'SEND_MESSAGE',
        content: 'Plan a ride',
      })

      const mockRouteOptions = createMockRouteOptions()
      state = rideFlowReducer(state, {
        type: 'PLANNING_SUCCESS',
        routeOptions: mockRouteOptions,
      })

      expect(state.phase).toBe('ROUTE_RESULTS')
      if (state.phase === 'ROUTE_RESULTS') {
        expect(state.selectedRouteId).toBeNull()

        // Try to navigate to export without selecting a route
        const nextState = rideFlowReducer(state, {
          type: 'NAVIGATE_EXPORT',
        })

        // Should stay in ROUTE_RESULTS (guard prevents transition)
        expect(nextState.phase).toBe('ROUTE_RESULTS')
      }
    })

    it('should allow NAVIGATE_EXPORT when selectedRouteId is set', () => {
      // Setup: Get to ROUTE_RESULTS state with selected route
      let state = rideFlowReducer(initialState, {
        type: 'SEND_MESSAGE',
        content: 'Plan a ride',
      })

      const mockRouteOptions = createMockRouteOptions()
      state = rideFlowReducer(state, {
        type: 'PLANNING_SUCCESS',
        routeOptions: mockRouteOptions,
      })

      // Select a route first
      state = rideFlowReducer(state, {
        type: 'SELECT_ROUTE',
        routeId: 'route-1',
      })

      expect(state.phase).toBe('ROUTE_DETAILS')
      if (state.phase === 'ROUTE_DETAILS') {
        expect(state.selectedRouteId).toBe('route-1')

        // Now navigate to export should work
        const nextState = rideFlowReducer(state, {
          type: 'NAVIGATE_EXPORT',
        })

        expect(nextState.phase).toBe('NAVIGATION_EXPORT')
      }
    })
  })

  describe('AC4: NEW_SESSION resets all state to IDLE', () => {
    it('should reset from any state to IDLE when NEW_SESSION is dispatched', () => {
      // Get to a complex state (ROUTE_RESULTS with selected route)
      let state = rideFlowReducer(initialState, {
        type: 'SEND_MESSAGE',
        content: 'Plan a ride',
      })

      const mockRouteOptions = createMockRouteOptions()
      state = rideFlowReducer(state, {
        type: 'PLANNING_SUCCESS',
        routeOptions: mockRouteOptions,
      })

      state = rideFlowReducer(state, {
        type: 'SELECT_ROUTE',
        routeId: 'route-1',
      })

      expect(state.phase).toBe('ROUTE_DETAILS')

      // Dispatch NEW_SESSION
      const nextState = rideFlowReducer(state, {
        type: 'NEW_SESSION',
      })

      expect(nextState.phase).toBe('IDLE')
      if (nextState.phase === 'IDLE') {
        expect(nextState.sessionId).toBeNull()
        expect(nextState.selectedRouteId).toBeNull()
        expect(nextState.routeOptions).toBeNull()
      }
    })
  })

  describe('AC5: LOAD_SESSION populates routeOptions from attachment', () => {
    it('should load session data into IDLE state', () => {
      const state = initialState
      expect(state.phase).toBe('IDLE')

      const mockRouteOptions = createMockRouteOptions()
      const nextState = rideFlowReducer(state, {
        type: 'LOAD_SESSION',
        sessionId: 'session-123',
        routeOptions: mockRouteOptions,
        selectedRouteId: 'route-1',
      })

      expect(nextState.phase).toBe('IDLE')
      if (nextState.phase === 'IDLE') {
        expect(nextState.sessionId).toBe('session-123')
        expect(nextState.routeOptions).toEqual(mockRouteOptions)
        expect(nextState.selectedRouteId).toBe('route-1')
      }
    })
  })

  describe('CANCEL_PLANNING action', () => {
    it('should return to ROUTE_RESULTS when routeOptions exist', () => {
      const mockRouteOptions = createMockRouteOptions()
      const planningState = {
        phase: 'PLANNING' as const,
        sessionId: 'test-session',
        planId: null,
        currentPhase: 'analyzing',
        routeOptions: mockRouteOptions,
        selectedRouteId: 'route-1',
      }
      const result = rideFlowReducer(planningState, { type: 'CANCEL_PLANNING' })
      expect(result.phase).toBe('ROUTE_RESULTS')
      if (result.phase === 'ROUTE_RESULTS') {
        expect(result.sessionId).toBe('test-session')
        expect(result.routeOptions).toEqual(mockRouteOptions)
        expect(result.selectedRouteId).toBe('route-1')
      }
    })

    it('should return to IDLE when no routeOptions', () => {
      const planningState = {
        phase: 'PLANNING' as const,
        sessionId: 'test-session',
        planId: null,
        currentPhase: 'analyzing',
        routeOptions: null,
        selectedRouteId: null,
      }
      const result = rideFlowReducer(planningState, { type: 'CANCEL_PLANNING' })
      expect(result.phase).toBe('IDLE')
    })
  })

  describe('Additional state transitions', () => {
    it('should transition from ROUTE_RESULTS to ROUTE_DETAILS when SELECT_ROUTE is dispatched', () => {
      // Setup: Get to ROUTE_RESULTS state
      let state = rideFlowReducer(initialState, {
        type: 'SEND_MESSAGE',
        content: 'Plan a ride',
      })

      const mockRouteOptions = createMockRouteOptions()
      state = rideFlowReducer(state, {
        type: 'PLANNING_SUCCESS',
        routeOptions: mockRouteOptions,
      })

      expect(state.phase).toBe('ROUTE_RESULTS')

      // Select a route
      const nextState = rideFlowReducer(state, {
        type: 'SELECT_ROUTE',
        routeId: 'route-1',
      })

      expect(nextState.phase).toBe('ROUTE_DETAILS')
      if (nextState.phase === 'ROUTE_DETAILS') {
        expect(nextState.selectedRouteId).toBe('route-1')
      }
    })

    it('should transition from ROUTE_DETAILS to SESSION_HISTORY when VIEW_HISTORY is dispatched', () => {
      // Setup: Get to ROUTE_DETAILS state
      let state = rideFlowReducer(initialState, {
        type: 'SEND_MESSAGE',
        content: 'Plan a ride',
      })

      const mockRouteOptions = createMockRouteOptions()
      state = rideFlowReducer(state, {
        type: 'PLANNING_SUCCESS',
        routeOptions: mockRouteOptions,
      })

      state = rideFlowReducer(state, {
        type: 'SELECT_ROUTE',
        routeId: 'route-1',
      })

      expect(state.phase).toBe('ROUTE_DETAILS')

      // View history
      const nextState = rideFlowReducer(state, {
        type: 'VIEW_HISTORY',
      })

      expect(nextState.phase).toBe('SESSION_HISTORY')
    })

    it('should transition from SESSION_HISTORY back to ROUTE_RESULTS when CLOSE_HISTORY is dispatched', () => {
      // Setup: Get to SESSION_HISTORY state
      let state = rideFlowReducer(initialState, {
        type: 'SEND_MESSAGE',
        content: 'Plan a ride',
      })

      const mockRouteOptions = createMockRouteOptions()
      state = rideFlowReducer(state, {
        type: 'PLANNING_SUCCESS',
        routeOptions: mockRouteOptions,
      })

      state = rideFlowReducer(state, {
        type: 'SELECT_ROUTE',
        routeId: 'route-1',
      })

      state = rideFlowReducer(state, {
        type: 'VIEW_HISTORY',
      })

      expect(state.phase).toBe('SESSION_HISTORY')

      // Close history
      const nextState = rideFlowReducer(state, {
        type: 'CLOSE_HISTORY',
      })

      expect(nextState.phase).toBe('ROUTE_RESULTS')
    })

    it('should transition from NAVIGATION_EXPORT back to ROUTE_DETAILS when CLOSE_EXPORT is dispatched', () => {
      // Setup: Get to NAVIGATION_EXPORT state
      let state = rideFlowReducer(initialState, {
        type: 'SEND_MESSAGE',
        content: 'Plan a ride',
      })

      const mockRouteOptions = createMockRouteOptions()
      state = rideFlowReducer(state, {
        type: 'PLANNING_SUCCESS',
        routeOptions: mockRouteOptions,
      })

      state = rideFlowReducer(state, {
        type: 'SELECT_ROUTE',
        routeId: 'route-1',
      })

      state = rideFlowReducer(state, {
        type: 'NAVIGATE_EXPORT',
      })

      expect(state.phase).toBe('NAVIGATION_EXPORT')

      // Close export
      const nextState = rideFlowReducer(state, {
        type: 'CLOSE_EXPORT',
      })

      expect(nextState.phase).toBe('ROUTE_DETAILS')
    })
  })
})
