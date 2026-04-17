/**
 * Card Registry
 *
 * Maps session_message `kind` values to their rendering components.
 * When ChatTranscript encounters a non-text message, it looks up the
 * kind in this registry and renders the mapped component.
 *
 * Placeholder stubs are used for kinds whose underlying tools are not
 * yet wired up (weather, saved_route) — they render nothing until
 * replaced with real components.
 */

import type { ComponentType } from 'react'
import type { Id } from '../../../server/convex/_generated/dataModel'
import { LocationSearchCard } from './cards/location-search-card'
import { PlanningCard } from './cards/planning-card'
import { ReasoningCard } from './cards/reasoning-card'
import { ThinkingCard } from './cards/thinking-card'
import { RoutingCard } from './routing-card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardAttachment =
  | { type: 'route_options'; routePlanId: Id<'route_plans'> }
  | {
      type: 'location_search'
      searchQuery: string
      results: {
        id: string
        name: string
        address: string
        types?: string[]
        location: { lat: number; lng: number }
        detourMinutes?: number
        distanceMeters?: number
      }[]
    }

export type CardProps = {
  message: {
    _id: Id<'session_messages'>
    createdAt: number
    status?: 'streaming' | 'running' | 'complete' | 'failed'
    content: string
    thinkingSteps?: {
      type: 'thinking' | 'tool_start' | 'tool_finish'
      toolName?: string
      summary: string
      detail?: string
      timestamp: number
    }[]
  }
  attachments: CardAttachment[]
  /** Called when the user taps a completed route card to view it on the map. */
  onViewOnMap?: () => void
}

export type CardKind =
  | 'routing_card'
  | 'weather_card'
  | 'saved_route_card'
  | 'reasoning'
  | 'thinking_card'
  | 'planning'
  | 'location_search_card'

// ---------------------------------------------------------------------------
// Placeholder stub — renders nothing until a real tool-backed card exists
// ---------------------------------------------------------------------------

const PlaceholderCard: ComponentType<CardProps> = () => null
PlaceholderCard.displayName = 'PlaceholderCard'

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const CARD_REGISTRY: Record<CardKind, ComponentType<CardProps>> = {
  routing_card: RoutingCard as ComponentType<CardProps>,
  weather_card: PlaceholderCard, // TODO: replace when fetchWeather tool is real
  saved_route_card: PlaceholderCard, // TODO: replace when saveRoute tool is real
  reasoning: ReasoningCard,
  thinking_card: ThinkingCard,
  planning: PlanningCard,
  location_search_card: LocationSearchCard,
}
