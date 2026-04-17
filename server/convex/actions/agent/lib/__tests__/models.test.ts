import { describe, test, expect, vi, beforeEach } from 'vitest'
import { getModel } from '@mariozechner/pi-ai'
import { getAgentModel, getAgentModelInfo } from '../models'

// Mock @mariozechner/pi-ai to avoid live API calls
vi.mock('@mariozechner/pi-ai', () => ({
  getModel: vi.fn((provider: string, model: string) => ({
    __provider: provider,
    __model: model,
  })),
}))

describe('agent model registry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC-1: getAgentModel high', () => {
    test('getAgentModel high calls getModel with mapped provider and model', () => {
      const model = getAgentModel('high')

      expect(getModel).toHaveBeenCalledWith('cerebras', 'zai-glm-4.7')
      expect(model).toMatchObject({
        __provider: 'cerebras',
        __model: 'zai-glm-4.7',
      })
    })
  })

  describe('AC-2: getAgentModel low', () => {
    test('getAgentModel low calls getModel with mapped provider and model', () => {
      const model = getAgentModel('low')

      expect(getModel).toHaveBeenCalledWith('cerebras', 'qwen-3-235b-a22b-instruct-2507')
      expect(model).toMatchObject({
        __provider: 'cerebras',
        __model: 'qwen-3-235b-a22b-instruct-2507',
      })
    })
  })

  describe('AC-3: getAgentModelInfo', () => {
    test('getAgentModelInfo returns provider and model tuple without calling getModel', () => {
      const info = getAgentModelInfo('high')

      // Should not call getModel (this is for metadata only)
      expect(getModel).not.toHaveBeenCalled()

      // Should return the exact provider/model tuple
      expect(info).toEqual({
        provider: 'cerebras',
        model: 'zai-glm-4.7',
      })
    })

    test('getAgentModelInfo works for low intelligence level', () => {
      const info = getAgentModelInfo('low')

      expect(getModel).not.toHaveBeenCalled()
      expect(info).toEqual({
        provider: 'cerebras',
        model: 'qwen-3-235b-a22b-instruct-2507',
      })
    })
  })
})
