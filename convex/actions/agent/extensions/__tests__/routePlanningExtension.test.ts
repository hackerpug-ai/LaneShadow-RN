'use node'

import { v } from 'convex/values'
import { createRoutePlanningExtension } from '../routePlanningExtension'

// Mock ActionCtx
const mockActionCtx = {
  db: {},
  auth: {},
  scheduler: {},
  runQuery: jest.fn(),
  runMutation: jest.fn(),
} as any

describe('routePlanningExtension', () => {
  describe('extension initialization', () => {
    it('has the correct extension name', () => {
      const extension = createRoutePlanningExtension(mockActionCtx)
      expect(extension.name).toBe('routePlanning')
    })

    it('provides exactly 5 tools', () => {
      const extension = createRoutePlanningExtension(mockActionCtx)
      expect(extension.tools).toHaveLength(5)
    })
  })

  describe('tool definitions', () => {
    let extension: ReturnType<typeof createRoutePlanningExtension>

    beforeEach(() => {
      extension = createRoutePlanningExtension(mockActionCtx)
    })

    it('defines compileSketch tool with correct properties', () => {
      const tool = extension.tools.find((t) => t.name === 'compileSketch')
      expect(tool).toBeDefined()
      expect(tool?.label).toBe('Compile Route Sketch')
      expect(tool?.description).toContain('Convert a route sketch')
      expect(tool?.parameters).toBeDefined()
      expect(tool?.execute).toBeInstanceOf(Function)
    })

    it('defines normalizeRoute tool with correct properties', () => {
      const tool = extension.tools.find((t) => t.name === 'normalizeRoute')
      expect(tool).toBeDefined()
      expect(tool?.label).toBe('Normalize Route')
      expect(tool?.description).toContain('Normalize a provider route')
      expect(tool?.parameters).toBeDefined()
      expect(tool?.execute).toBeInstanceOf(Function)
    })

    it('defines computeRouteIndex tool with correct properties', () => {
      const tool = extension.tools.find((t) => t.name === 'computeRouteIndex')
      expect(tool).toBeDefined()
      expect(tool?.label).toBe('Compute Route Index')
      expect(tool?.description).toContain('Build a spatial index')
      expect(tool?.parameters).toBeDefined()
      expect(tool?.execute).toBeInstanceOf(Function)
    })

    it('defines probeConditions tool with correct properties', () => {
      const tool = extension.tools.find((t) => t.name === 'probeConditions')
      expect(tool).toBeDefined()
      expect(tool?.label).toBe('Probe Weather Conditions')
      expect(tool?.description).toContain('Probe weather conditions')
      expect(tool?.parameters).toBeDefined()
      expect(tool?.execute).toBeInstanceOf(Function)
    })

    it('defines mapConditions tool with correct properties', () => {
      const tool = extension.tools.find((t) => t.name === 'mapConditions')
      expect(tool).toBeDefined()
      expect(tool?.label).toBe('Map Weather Conditions')
      expect(tool?.description).toContain('Map probed weather conditions')
      expect(tool?.parameters).toBeDefined()
      expect(tool?.execute).toBeInstanceOf(Function)
    })

    it('all tools have required properties', () => {
      extension.tools.forEach((tool) => {
        expect(tool.name).toBeDefined()
        expect(tool.label).toBeDefined()
        expect(tool.description).toBeDefined()
        expect(tool.parameters).toBeDefined()
        expect(tool.execute).toBeInstanceOf(Function)
      })
    })
  })

  describe('system prompt', () => {
    it('provides a system prompt', () => {
      const extension = createRoutePlanningExtension(mockActionCtx)
      expect(extension.systemPrompt).toBeDefined()
      expect(typeof extension.systemPrompt).toBe('string')
    })

    it('system prompt contains route planning instructions', () => {
      const extension = createRoutePlanningExtension(mockActionCtx)
      expect(extension.systemPrompt).toContain('motorcycle route planning')
      expect(extension.systemPrompt).toContain('Route Planning Process')
      expect(extension.systemPrompt).toContain('compileSketch')
      expect(extension.systemPrompt).toContain('normalizeRoute')
      expect(extension.systemPrompt).toContain('computeRouteIndex')
      expect(extension.systemPrompt).toContain('probeConditions')
      expect(extension.systemPrompt).toContain('mapConditions')
    })
  })

  describe('extension structure', () => {
    it('returns extension object with required properties', () => {
      const extension = createRoutePlanningExtension(mockActionCtx)
      expect(extension).toHaveProperty('name')
      expect(extension).toHaveProperty('tools')
      expect(extension).toHaveProperty('systemPrompt')
    })

    it('tools is an array', () => {
      const extension = createRoutePlanningExtension(mockActionCtx)
      expect(Array.isArray(extension.tools)).toBe(true)
    })
  })
})
