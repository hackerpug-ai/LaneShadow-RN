'use node'

/**
 * Maps a tool name + result to a rider-friendly summary string.
 * Used by the orchestrator to emit planning events with accessible status lines.
 *
 * These summaries appear in the PlanningCard bottom sheet — they should read
 * like a natural stream of thought, not developer debug output.
 */
export function summarizeToolResult(toolName: string, result: unknown): string {
  const r = result as any

  switch (toolName) {
    case 'geocode': {
      const label = r?.results?.[0]?.label
      if (label) {
        // Extract just the city/place name (before first comma)
        const short = label.split(',')[0]
        return `Looking up ${short}`
      }
      return 'Looking up location'
    }

    case 'createRouteSketch': {
      const label = r?.sketch?.label
      return label ? `Designing route: ${label}` : 'Designing your route'
    }

    case 'compileSketch': {
      if (r?.type === 'error') {
        const hint = r?.hint
        if (typeof hint === 'string' && hint.includes('partial_route')) {
          return 'Some roads need adjusting...'
        }
        return 'Adjusting route...'
      }
      return 'Found the best roads'
    }

    case 'planRoute':
      return 'Mapping out your ride'

    case 'searchNearby': {
      // Check for error result
      if (result && typeof result === 'object' && 'status' in result && result.status === 'error') {
        return 'Search failed'
      }
      const results = Array.isArray(result) ? result : []
      const n = results.length
      return n > 0 ? `Found ${n} place${n === 1 ? '' : 's'} nearby` : 'Searched nearby'
    }

    case 'webSearch':
      return 'Checked the latest info'

    case 'routing_agent': {
      if (r?.status === 'route_ready') return 'Your route is ready'
      if (r?.status === 'needs_clarification') return 'Need a bit more info'
      return r?.summary ?? 'Route planning done'
    }

    case 'search_agent': {
      if (r?.status === 'answered') {
        // Check if data contains errors
        const data = r?.data
        if (Array.isArray(data) && data.length > 0) {
          const hasErrors = data.some((item: any) =>
            item?.result?.status === 'error' || item?.result?.type === 'error'
          )
          if (hasErrors) {
            return 'Some searches failed — trying my best'
          }
        }
        return 'Found what you need'
      }
      if (r?.status === 'not_applicable') {
        return "Couldn't complete that search"
      }
      return r?.summary ?? 'Done searching'
    }

    case 'enrichment_agent': {
      if (r?.status === 'answered') {
        // Check if data contains errors
        const data = r?.data
        if (Array.isArray(data) && data.length > 0) {
          const hasErrors = data.some((item: any) =>
            item?.result?.type === 'error' || item?.result?.status === 'error'
          )
          if (hasErrors) {
            return 'Some checks failed — partial results'
          }
        }
        return 'Got your answer'
      }
      if (r?.status === 'not_applicable') {
        return "Couldn't complete that check"
      }
      return r?.summary ?? 'Done checking'
    }

    default:
      return 'Working on it...'
  }
}
