import { describe, expect, it } from 'vitest'

// AC-3: feedbackValidator has action union of 4 literals
describe('routeFeedbackValidator', () => {
  it('has all fields from PRD feedback schema', async () => {
    const { routeFeedbackValidator } = await import('../route-feedback.js')
    expect(routeFeedbackValidator).toBeDefined()
    expect(routeFeedbackValidator.kind).toBe('object')

    const fields = routeFeedbackValidator.fields

    // Verify all required fields
    expect(fields.routeId).toBeDefined()
    expect(fields.userId).toBeDefined()
    expect(fields.action).toBeDefined()
    expect(fields.rating).toBeDefined()
    expect(fields.locationLat).toBeDefined()
    expect(fields.locationLng).toBeDefined()
    expect(fields.archetypeFilter).toBeDefined()
    expect(fields.timestamp).toBeDefined()
  })

  it('action field accepts exactly 4 literal values', async () => {
    const { ROUTE_FEEDBACK_FIELDS } = await import('../route-feedback.js')
    const actionValidator = ROUTE_FEEDBACK_FIELDS.action

    expect(actionValidator.kind).toBe('union')
    const members = actionValidator.members.map((m: { value: string }) => m.value)
    expect(members).toContain('save')
    expect(members).toContain('hide')
    expect(members).toContain('complete')
    expect(members).toContain('rate')
    expect(members.length).toBe(4)
  })

  it('rating field is optional', async () => {
    const { routeFeedbackValidator } = await import('../route-feedback.js')
    const fields = routeFeedbackValidator.fields
    expect(fields.rating?.isOptional).toBe('optional')
  })

  it('locationLat field is optional', async () => {
    const { routeFeedbackValidator } = await import('../route-feedback.js')
    const fields = routeFeedbackValidator.fields
    expect(fields.locationLat?.isOptional).toBe('optional')
  })

  it('locationLng field is optional', async () => {
    const { routeFeedbackValidator } = await import('../route-feedback.js')
    const fields = routeFeedbackValidator.fields
    expect(fields.locationLng?.isOptional).toBe('optional')
  })

  it('archetypeFilter field is optional', async () => {
    const { routeFeedbackValidator } = await import('../route-feedback.js')
    const fields = routeFeedbackValidator.fields
    expect(fields.archetypeFilter?.isOptional).toBe('optional')
  })
})
