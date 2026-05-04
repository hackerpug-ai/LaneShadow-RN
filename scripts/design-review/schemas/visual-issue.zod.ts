import { z } from 'zod'

/**
 * Zod schema for visual issue validation from Vision LLM eval
 *
 * Per AC-2: z.array(z.object({
 *   component, passed,
 *   issue_type ∈ {spacing,color,typography,placement,overflow,missing},
 *   observed, expected,
 *   severity ∈ {low,med,high},
 *   confidence ∈ [0,1]
 * }))
 */

export const VisualIssueSchema = z.array(
  z.object({
    component: z.string(),
    passed: z.boolean(),
    issue_type: z.enum(['spacing', 'color', 'typography', 'placement', 'overflow', 'missing']),
    observed: z.record(z.string()),
    expected: z.record(z.string()),
    severity: z.enum(['low', 'med', 'high']),
    confidence: z.number().min(0).max(1),
  }),
)

export type VisualIssue = z.infer<typeof VisualIssueSchema>
