'use node'

import { Type } from '@sinclair/typebox'

/**
 * Route planning validator schemas using TypeBox for pi ToolDefinitions.
 * These mirror the existing Zod schemas in models/ but use TypeBox for AJV validation.
 */
export const RoutePlanningValidators = {
  PlanInput: Type.Object({
    start: Type.Object({
      lat: Type.Number(),
      lng: Type.Number(),
      label: Type.Optional(Type.String()),
      placeId: Type.Optional(Type.String()),
    }),
    end: Type.Object({
      lat: Type.Number(),
      lng: Type.Number(),
      label: Type.Optional(Type.String()),
      placeId: Type.Optional(Type.String()),
    }),
    departureTime: Type.Integer(),
    preferences: Type.Optional(Type.Object({
      scenicBias: Type.Optional(Type.Union([Type.Literal('low'), Type.Literal('default'), Type.Literal('high')])),
    })),
  }),

  RouteSketch: Type.Object({
    label: Type.String(),
    rationale: Type.String(),
    segments: Type.Array(Type.Object({
      roadName: Type.String(),
      fromName: Type.String(),
      toName: Type.String(),
      viaNames: Type.Optional(Type.Array(Type.String())),
    })),
    anchorPoints: Type.Array(Type.Object({
      name: Type.String(),
      kind: Type.Union([
        Type.Literal('junction'),
        Type.Literal('pass'),
        Type.Literal('vista'),
        Type.Literal('town'),
      ]),
      lat: Type.Optional(Type.Number()),
      lng: Type.Optional(Type.Number()),
    })),
  }),

  RouteSnapshot: Type.Object({
    provider: Type.String(),
    bounds: Type.Object({
      north: Type.Number(),
      south: Type.Number(),
      east: Type.Number(),
      west: Type.Number(),
    }),
    overviewGeometry: Type.Object({
      format: Type.Literal('polyline'),
      encoding: Type.String(),
      precision: Type.Number(),
      value: Type.String(),
    }),
    legs: Type.Array(Type.Any()),
    overlays: Type.Object({
      wind: Type.Optional(Type.Any()),
      temperature: Type.Optional(Type.Any()),
    }),
  }),

  RouteIndex: Type.Object({
    routeFingerprint: Type.String(),
    sampledPoints: Type.Array(Type.Object({
      lat: Type.Number(),
      lng: Type.Number(),
      distanceFromStartMeters: Type.Number(),
    })),
  }),

  ProbedConditions: Type.Array(Type.Object({
    distanceFromStartMeters: Type.Number(),
    lat: Type.Number(),
    lng: Type.Number(),
    wind: Type.Object({
      windSpeed: Type.Number(),
      windDirectionDeg: Type.Number(),
      windGust: Type.Optional(Type.Number()),
      unit: Type.Union([Type.Literal('m/s'), Type.Literal('km/h')]),
      timeIso: Type.String(),
    }),
  })),
}
