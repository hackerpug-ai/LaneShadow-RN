/**
 * Route Feedback Models
 *
 * Defines types and validators for user feedback on curated routes.
 * Users can save, hide, complete, or rate routes.
 */

import { v } from "convex/values";

/**
 * Route feedback actions
 */
export const ROUTE_FEEDBACK_ACTION = {
  SAVE: "save",
  HIDE: "hide",
  COMPLETE: "complete",
  RATE: "rate",
} as const;

export type RouteFeedbackAction = (typeof ROUTE_FEEDBACK_ACTION)[keyof typeof ROUTE_FEEDBACK_ACTION];

/**
 * Route feedback fields
 * Corresponds to the feedback schema in the PRD.
 */
export const ROUTE_FEEDBACK_FIELDS = {
  routeId: v.string(),
  userId: v.string(),
  action: v.union(
    v.literal("save"),
    v.literal("hide"),
    v.literal("complete"),
    v.literal("rate")
  ),
  rating: v.optional(v.number()),
  locationLat: v.optional(v.number()),
  locationLng: v.optional(v.number()),
  archetypeFilter: v.optional(v.string()),
  timestamp: v.number(),
} as const;

/**
 * Route feedback type
 */
export type RouteFeedback = {
  routeId: string;
  userId: string;
  action: RouteFeedbackAction;
  rating?: number | null;
  locationLat?: number | null;
  locationLng?: number | null;
  archetypeFilter?: string | null;
  timestamp: number;
};

/**
 * Route feedback validator
 */
export const routeFeedbackValidator = v.object(ROUTE_FEEDBACK_FIELDS);
