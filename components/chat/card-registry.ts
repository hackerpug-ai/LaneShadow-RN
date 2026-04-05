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
import type { Id } from '../../convex/_generated/dataModel'
import { RoutingCard } from './routing-card'
import { ReasoningCard } from './cards/reasoning-card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardAttachment = {
  type: 'route_options'
  routePlanId: Id<'route_plans'>
}

export type CardProps = {
  message: {
    _id: Id<'session_messages'>
    createdAt: number
    status?: 'streaming' | 'running' | 'complete' | 'failed'
    content: string
  }
  attachments: CardAttachment[]
}

export type CardKind =
  | 'routing_card'
  | 'weather_card'
  | 'saved_route_card'
  | 'reasoning'

// ---------------------------------------------------------------------------
// Placeholder stub — renders nothing until a real tool-backed card exists
// ---------------------------------------------------------------------------

const PlaceholderCard: ComponentType<CardProps> = () => null
PlaceholderCard.displayName = 'PlaceholderCard'

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const CARD_REGISTRY: Record<CardKind, ComponentType<CardProps>> = {
  routing_card: RoutingCard,
  weather_card: PlaceholderCard, // TODO: replace when fetchWeather tool is real
  saved_route_card: PlaceholderCard, // TODO: replace when saveRoute tool is real
  reasoning: ReasoningCard,
}
