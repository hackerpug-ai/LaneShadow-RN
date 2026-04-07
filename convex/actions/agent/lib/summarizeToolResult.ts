'use node'

/**
 * Maps a tool name + result to a human-readable summary string.
 * Used by the orchestrator to emit planning events with meaningful status lines.
 */
export function summarizeToolResult(toolName: string, result: unknown): string {
  const r = result as any

  switch (toolName) {
    case 'geocode': {
      const label = r?.results?.[0]?.label
      return label ? `Geocoded ${label}` : `${toolName} complete`
    }

    case 'createRouteSketch': {
      const label = r?.sketch?.label
      return label ? `Sketched: ${label}` : `${toolName} complete`
    }

    case 'compileSketch': {
      const options = r?.data?.options
      const n = Array.isArray(options) ? options.length : 0
      return n > 0 ? `Compiled ${n} segments` : `${toolName} complete`
    }

    case 'planRoute':
      return 'Planned route'

    case 'searchNearby': {
      const results = Array.isArray(result) ? result : []
      return `Found ${results.length} nearby places`
    }

    case 'webSearch':
      return 'Searched the web'

    case 'routing_agent': {
      return r?.summary ?? 'Route ready'
    }

    case 'search_agent': {
      return r?.summary ?? 'Search complete'
    }

    case 'enrichment_agent': {
      return r?.summary ?? 'Analysis complete'
    }

    default:
      return `${toolName} complete`
  }
}
