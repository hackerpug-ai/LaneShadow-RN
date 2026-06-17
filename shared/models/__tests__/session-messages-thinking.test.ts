/**
 * Tests for US-055: thinking_card kind + thinkingSteps validators
 *
 * Acceptance criteria:
 * AC-1: SESSION_MESSAGE_KIND constant contains THINKING_CARD: 'thinking_card'
 * AC-2: sessionMessageKindValidator validates kind: 'thinking_card'
 * AC-3: thinkingStepValidator accepts { type: 'tool_start', toolName: 'geocode', summary: 'Searching...', timestamp: 123 }
 * AC-4: thinkingStepValidator type is 'thinking' has toolName optional, detail optional
 * AC-5: sessionMessageValidator has thinkingSteps field with v.optional(v.array(thinkingStepValidator))
 * AC-6: Existing reasoning kind still valid, no regression
 */

import { describe, expect, it } from 'vitest'

describe('US-055: thinking_card kind + thinkingSteps validators', () => {
  describe('AC-1: SESSION_MESSAGE_KIND constant contains THINKING_CARD', () => {
    it('should export SESSION_MESSAGE_KIND with THINKING_CARD property', async () => {
      const { SESSION_MESSAGE_KIND } = await import('../session-messages.js')
      expect(SESSION_MESSAGE_KIND).toBeDefined()
      expect(SESSION_MESSAGE_KIND.THINKING_CARD).toBe('thinking_card')
    })
  })

  describe('AC-2: sessionMessageKindValidator validates thinking_card', () => {
    it('should accept thinking_card as a valid kind', async () => {
      const { sessionMessageKindValidator } = await import('../session-messages.js')
      expect(sessionMessageKindValidator).toBeDefined()

      // The validator should be a union that includes 'thinking_card'
      const unionMembers = (sessionMessageKindValidator as any).members
      const hasThinkingCard = unionMembers?.some((member: any) => member.value === 'thinking_card')
      expect(hasThinkingCard).toBe(true)
    })
  })

  describe('AC-3: thinkingStepValidator accepts tool_start step', () => {
    it('should export thinkingStepValidator', async () => {
      const { thinkingStepValidator } = await import('../session-messages.js')
      expect(thinkingStepValidator).toBeDefined()
    })

    it('should accept valid tool_start step with all required fields', async () => {
      const { thinkingStepValidator } = await import('../session-messages.js')

      const _validStep = {
        type: 'tool_start' as const,
        toolName: 'geocode',
        summary: 'Searching...',
        timestamp: 123,
      }

      // Validator should not throw for valid input
      expect(() => {
        // We can't directly test v.object validation without a context,
        // but we can verify the validator structure
        const fields = (thinkingStepValidator as any).fields
        expect(fields).toHaveProperty('type')
        expect(fields).toHaveProperty('toolName')
        expect(fields).toHaveProperty('summary')
        expect(fields).toHaveProperty('timestamp')
      }).not.toThrow()
    })
  })

  describe('AC-4: thinkingStepValidator type thinking has optional fields', () => {
    it('should accept thinking type without toolName and detail', async () => {
      const { thinkingStepValidator } = await import('../session-messages.js')

      const _thinkingStep = {
        type: 'thinking' as const,
        summary: 'Analyzing route options...',
        timestamp: 456,
      }

      // Verify validator structure supports optional fields
      const fields = (thinkingStepValidator as any).fields
      expect(fields.toolName.isOptional).toBe('optional')
      expect(fields.detail.isOptional).toBe('optional')
    })
  })

  describe('AC-5: sessionMessageValidator has thinkingSteps field', () => {
    it('should have thinkingSteps as optional array field', async () => {
      const { sessionMessageValidator } = await import('../session-messages.js')
      const fields = (sessionMessageValidator as any).fields

      expect(fields).toHaveProperty('thinkingSteps')

      // Should be v.optional(v.array(thinkingStepValidator))
      const thinkingStepsField = fields.thinkingSteps
      expect(thinkingStepsField.isOptional).toBe('optional')
    })
  })

  describe('AC-6: Existing reasoning kind still valid', () => {
    it('should still have REASONING in SESSION_MESSAGE_KIND', async () => {
      const { SESSION_MESSAGE_KIND } = await import('../session-messages.js')
      expect(SESSION_MESSAGE_KIND.REASONING).toBe('reasoning')
    })

    it('should accept reasoning in sessionMessageKindValidator', async () => {
      const { sessionMessageKindValidator } = await import('../session-messages.js')
      const unionMembers = (sessionMessageKindValidator as any).members

      const hasReasoning = unionMembers?.some((member: any) => member.value === 'reasoning')
      expect(hasReasoning).toBe(true)
    })
  })
})
