'use node'

import { MemorySaver } from '@langchain/langgraph'

import { createPlanningGraph } from '../graphs/planningGraph'
import { planRide } from '../planRide'

// -----------------------------------------------------------------------------
// Mock external dependencies
// -----------------------------------------------------------------------------

// Mock ChatOpenAI for LLM calls
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    withStructuredOutput: jest.fn().mockReturnValue({
      invoke: jest.fn(),
    }),
  })),
}))

// Mock env to control OPENAI_API_KEY
jest.mock('../../../lib/env', () => ({
  OPENAI_API_KEY: 'test-key',
}))

// Mock tools for deterministic processing
jest.mock('../tools/compileSketch', () => ({
  compileSketch: jest.fn(),
}))

jest.mock('../tools/normalizeRoute', () => ({
  normalizeRoute: jest.fn(),
}))

jest.mock('../tools/computeRouteIndex', () => ({
  computeRouteIndex: jest.fn(),
}))

jest.mock('../tools/probeConditions', () => ({
  probeConditions: jest.fn(),
}))

jest.mock('../tools/mapConditions', () => ({
  mapConditions: jest.fn(),
}))

// Mock guards for session
jest.mock('../../../guards', () => ({
  requireSession: jest.fn(),
}))

import { ChatOpenAI } from '@langchain/openai'
import { requireSession } from '../../../guards'
import { compileSketch } from '../tools/compileSketch'
import { computeRouteIndex } from '../tools/computeRouteIndex'
import { mapConditions } from '../tools/mapConditions'
import { normalizeRoute } from '../tools/normalizeRoute'
import { probeConditions } from '../tools/probeConditions'

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const planInput = {
  start: { lat: 0, lng: 0, label: 'Start' },
  end: { lat: 1, lng: 1, label: 'End' },
  departureTime: Date.UTC(2026, 0, 1, 12, 0, 0),
  preferences: { scenicBias: 'default' as const },
}

const mockSketches = [
  {
    label: 'Scenic 1',
    rationale: 'Coastal route',
    segments: [{ roadName: 'R1', fromName: 'A', toName: 'B' }],
    anchorPoints: [{ name: 'Mid', kind: 'junction' as const, lat: 0.5, lng: 0.5 }],
  },
  {
    label: 'Scenic 2',
    rationale: 'Mountain route',
    segments: [{ roadName: 'R2', fromName: 'C', toName: 'D' }],
    anchorPoints: [{ name: 'Pass', kind: 'pass' as const }],
  },
]

const mockProviderRoute = {
  provider: 'mock',
  bounds: { north: 1, south: 0, east: 1, west: 0 },
  overviewGeometry: {
    format: 'polyline' as const,
    encoding: 'mock',
    precision: 5,
    value: 'OVERVIEW',
  },
  legs: [
    {
      legIndex: 0,
      start: { lat: 0, lng: 0 },
      end: { lat: 1, lng: 1 },
      distanceMeters: 1000,
      durationSeconds: 600,
      geometry: { format: 'polyline' as const, encoding: 'mock', precision: 5, value: 'LEG' },
    },
  ],
}

const mockWindData = [
  {
    distanceFromStartMeters: 0,
    lat: 0,
    lng: 0,
    wind: { windSpeed: 8, windDirectionDeg: 180, unit: 'm/s', timeIso: '2026-01-01T12:00:00Z' },
  },
]

const mockRouteSnapshot = {
  provider: 'mock',
  bounds: { north: 1, south: 0, east: 1, west: 0 },
  origin: { lat: 0, lng: 0, label: 'Start' },
  destination: { lat: 1, lng: 1, label: 'End' },
  waypoints: [],
  overviewGeometry: {
    format: 'polyline' as const,
    encoding: 'mock',
    precision: 5,
    value: 'OVERVIEW',
  },
  legs: [
    {
      legIndex: 0,
      start: { lat: 0, lng: 0 },
      end: { lat: 1, lng: 1 },
      distanceMeters: 1000,
      durationSeconds: 600,
      geometry: { format: 'polyline' as const, encoding: 'mock', precision: 5, value: 'LEG' },
    },
  ],
  annotations: [],
  overlays: {},
}

const mockRouteIndex = {
  routeFingerprint: 'test-fingerprint',
  sampledPoints: [
    { lat: 0, lng: 0, distanceFromStartMeters: 0 },
    { lat: 1, lng: 1, distanceFromStartMeters: 1000 },
  ],
}

// -----------------------------------------------------------------------------
// Graph Tests (LangGraph patterns)
// -----------------------------------------------------------------------------

describe('planningGraph', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('full graph execution', () => {
    it('executes full planning flow with mocked LLM and providers', async () => {
      // Setup LLM mock to return sketches
      const mockInvoke = jest.fn().mockResolvedValue({ sketches: mockSketches })
      ;(ChatOpenAI as unknown as jest.Mock).mockImplementation(() => ({
        withStructuredOutput: jest.fn().mockReturnValue({ invoke: mockInvoke }),
      }))

      // Setup routing mock
      ;(compileSketch as jest.Mock).mockResolvedValue(mockProviderRoute)
      ;(normalizeRoute as jest.Mock).mockResolvedValue(mockRouteSnapshot)
      ;(computeRouteIndex as jest.Mock).mockResolvedValue(mockRouteIndex)

      // Setup weather mocks
      ;(probeConditions as jest.Mock).mockResolvedValue(mockWindData)
      ;(mapConditions as jest.Mock).mockResolvedValue({
        generatedAt: Date.now(),
        modelVersion: 'test',
        legend: [{ level: 'high', label: 'High' }],
        byLeg: [
          {
            legIndex: 0,
            segments: [{ startMeters: 0, endMeters: 1000, level: 'high' }],
          },
        ],
      })

      // Create and compile graph with checkpointer (LangGraph test pattern)
      const graph = createPlanningGraph()
      const checkpointer = new MemorySaver()
      const compiled = graph.compile({ checkpointer })

      // Invoke graph
      const result = await compiled.invoke(
        {
          planInput,
          planId: '',
          sketches: [],
          options: [],
          error: null,
        },
        { configurable: { thread_id: 'test-1' } }
      )

      // Assertions
      expect(result.options).toHaveLength(2)
      expect(result.error).toBeNull()
      expect(result.planId).toBeTruthy()
      result.options.forEach((opt) => {
        expect(opt.overlaysPreview.conditionsStatus).toBe('ok')
        expect(opt.overlaysPreview.windSummary).toBe('high')
      })
    })

    it('soft-fails conditions and still returns routes', async () => {
      // Setup LLM mock
      const mockInvoke = jest.fn().mockResolvedValue({ sketches: [mockSketches[0]] })
      ;(ChatOpenAI as unknown as jest.Mock).mockImplementation(() => ({
        withStructuredOutput: jest.fn().mockReturnValue({ invoke: mockInvoke }),
      }))

      // Setup routing mock
      ;(compileSketch as jest.Mock).mockResolvedValue(mockProviderRoute)
      ;(normalizeRoute as jest.Mock).mockResolvedValue(mockRouteSnapshot)
      ;(computeRouteIndex as jest.Mock).mockResolvedValue(mockRouteIndex)

      // Setup weather to fail (soft-fail scenario)
      ;(probeConditions as jest.Mock).mockRejectedValue(new Error('weather unavailable'))

      // Create and compile graph
      const graph = createPlanningGraph()
      const checkpointer = new MemorySaver()
      const compiled = graph.compile({ checkpointer })

      const result = await compiled.invoke(
        { planInput, planId: '', sketches: [], options: [], error: null },
        { configurable: { thread_id: 'test-2' } }
      )

      // Route should still be returned with unavailable conditions
      expect(result.options).toHaveLength(1)
      expect(result.options[0].overlaysPreview.conditionsStatus).toBe('unavailable')
      expect(result.options[0].overlaysPreview.windSummary).toBe('unavailable')
    })
  })

  describe('individual node testing', () => {
    it('processRoutes node processes sketches into options', async () => {
      // Setup mocks
      ;(compileSketch as jest.Mock).mockResolvedValue(mockProviderRoute)
      ;(normalizeRoute as jest.Mock).mockResolvedValue(mockRouteSnapshot)
      ;(computeRouteIndex as jest.Mock).mockResolvedValue(mockRouteIndex)
      ;(probeConditions as jest.Mock).mockResolvedValue(mockWindData)
      ;(mapConditions as jest.Mock).mockResolvedValue({
        generatedAt: Date.now(),
        modelVersion: 'test',
        legend: [{ level: 'low', label: 'Low' }],
        byLeg: [
          {
            legIndex: 0,
            segments: [{ startMeters: 0, endMeters: 1000, level: 'low' }],
          },
        ],
      })

      // Create graph and get compiled version to access nodes
      const graph = createPlanningGraph()
      const compiled = graph.compile()

      // Test processRoutes node directly (LangGraph pattern)
      const nodeResult = await compiled.nodes['processRoutes'].invoke({
        planInput,
        planId: 'test-plan',
        sketches: mockSketches,
        options: [],
        error: null,
      })

      expect(nodeResult.options).toHaveLength(2)
      nodeResult.options.forEach((opt) => {
        expect(opt.label).toBeTruthy()
        expect(opt.stats.distanceMeters).toBe(1000)
      })
    })

    it('processRoutes node returns empty options when error is set', async () => {
      const graph = createPlanningGraph()
      const compiled = graph.compile()

      // Test with error state - should skip processing
      const nodeResult = await compiled.nodes['processRoutes'].invoke({
        planInput,
        planId: '',
        sketches: mockSketches,
        options: [],
        error: 'LLM_SKETCH_INVALID', // Error set, should skip
      })

      expect(nodeResult.options).toHaveLength(0)
    })

    it('processRoutes node returns empty options when no sketches', async () => {
      const graph = createPlanningGraph()
      const compiled = graph.compile()

      const nodeResult = await compiled.nodes['processRoutes'].invoke({
        planInput,
        planId: 'test-plan',
        sketches: [], // No sketches
        options: [],
        error: null,
      })

      expect(nodeResult.options).toHaveLength(0)
    })
  })

  describe('partial execution', () => {
    it('can resume from generateSketches to processRoutes', async () => {
      // Setup mocks for processRoutes only
      ;(compileSketch as jest.Mock).mockResolvedValue(mockProviderRoute)
      ;(normalizeRoute as jest.Mock).mockResolvedValue(mockRouteSnapshot)
      ;(computeRouteIndex as jest.Mock).mockResolvedValue(mockRouteIndex)
      ;(probeConditions as jest.Mock).mockResolvedValue(mockWindData)
      ;(mapConditions as jest.Mock).mockResolvedValue({
        generatedAt: Date.now(),
        modelVersion: 'test',
        legend: [{ level: 'moderate', label: 'Moderate' }],
        byLeg: [
          {
            legIndex: 0,
            segments: [{ startMeters: 0, endMeters: 1000, level: 'moderate' }],
          },
        ],
      })

      // Create graph with checkpointer for partial execution
      const graph = createPlanningGraph()
      const checkpointer = new MemorySaver()
      const compiled = graph.compile({ checkpointer })

      // Simulate state after generateSketches completed
      await compiled.updateState(
        { configurable: { thread_id: 'partial-1' } },
        {
          planInput,
          planId: 'simulated-plan-id',
          sketches: mockSketches,
          options: [],
          error: null,
        },
        'generateSketches' // State is as if coming from generateSketches
      )

      // Resume execution - will start from processRoutes
      const result = await compiled.invoke(null, {
        configurable: { thread_id: 'partial-1' },
      })

      expect(result.options).toHaveLength(2)
      expect(result.planId).toBe('simulated-plan-id')
      result.options.forEach((opt) => {
        expect(opt.overlaysPreview.windSummary).toBe('moderate')
      })
    })
  })
})

// -----------------------------------------------------------------------------
// planRide Action Tests
// -----------------------------------------------------------------------------

const mockSession = {
  user: {
    _id: 'user-id-123' as any,
    clerkUserId: 'clerk-user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastLocalUpdateAt: Date.now(),
  },
}

describe('planRide action', () => {
  const mockCtx = {} as unknown as any

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock requireSession to return a valid session
    ;(requireSession as jest.Mock).mockResolvedValue(mockSession)
  })

  it('returns options from graph execution', async () => {
    // Setup all mocks for full flow
    const mockInvoke = jest.fn().mockResolvedValue({ sketches: mockSketches })
    ;(ChatOpenAI as unknown as jest.Mock).mockImplementation(() => ({
      withStructuredOutput: jest.fn().mockReturnValue({ invoke: mockInvoke }),
    }))
    ;(compileSketch as jest.Mock).mockResolvedValue(mockProviderRoute)
    ;(normalizeRoute as jest.Mock).mockResolvedValue(mockRouteSnapshot)
    ;(computeRouteIndex as jest.Mock).mockResolvedValue(mockRouteIndex)
    ;(probeConditions as jest.Mock).mockResolvedValue(mockWindData)
    ;(mapConditions as jest.Mock).mockResolvedValue({
      generatedAt: Date.now(),
      modelVersion: 'test',
      legend: [{ level: 'high', label: 'High' }],
      byLeg: [
        {
          legIndex: 0,
          segments: [{ startMeters: 0, endMeters: 1000, level: 'high' }],
        },
      ],
    })

    const result = await (planRide as any).handler(mockCtx, { planInput })

    expect(result.options).toHaveLength(2)
    expect(result.planId).toBeTruthy()
  })

  it('throws error when graph returns error', async () => {
    // Setup LLM to fail (no API key scenario simulated via mock)
    jest.resetModules()
    jest.doMock('../../../lib/env', () => ({ OPENAI_API_KEY: undefined }))

    // Re-import to get updated mock - but for this test, just mock the behavior
    const mockInvoke = jest.fn().mockRejectedValue(new Error('LLM_SKETCH_INVALID'))
    ;(ChatOpenAI as unknown as jest.Mock).mockImplementation(() => ({
      withStructuredOutput: jest.fn().mockReturnValue({ invoke: mockInvoke }),
    }))

    await expect((planRide as any).handler(mockCtx, { planInput })).rejects.toThrow()
  })
})
