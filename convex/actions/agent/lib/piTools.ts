'use node'

import { Type } from '@sinclair/typebox'

/**
 * Agent tool parameter schemas (TypeBox) passed to pi-ai's Tool definitions.
 *
 * Design rule: every property is REQUIRED. Instead of Type.Optional(), use
 * Type.Union([X, Type.Null()]) for "maybe absent" fields. This keeps the
 * JSON schema compatible with OpenAI strict structured-output mode, which
 * rejects optional properties.
 */
export const AgentToolSchemas = {
  geocode: Type.Object({
    query: Type.String({
      description:
        'A place name, address, or landmark (e.g. "Santa Cruz", "Golden Gate Bridge", "123 Main St Boulder CO")',
    }),
  }),

  createRouteSketch: Type.Object({
    label: Type.String({
      description: 'A brief label for this route (e.g., "Highway 280 to Skyline Blvd")',
    }),
    rationale: Type.String({
      description: 'Explanation of why this route matches the rider\'s request (e.g., "Avoids Highway 1 and uses scenic mountain roads")',
    }),
    segments: Type.Array(
      Type.Object({
        roadName: Type.String({ description: 'Name of the road (e.g., "Highway 280", "Skyline Blvd")' }),
        fromName: Type.String({ description: 'Starting point or junction (e.g., "San Jose", "Highway 85")' }),
        toName: Type.String({ description: 'Ending point or junction (e.g., "San Bruno", "Highway 92")' }),
        viaNames: Type.Union([
          Type.Array(Type.String()),
          Type.Null(),
        ], { description: 'Optional intermediate places this road passes through' }),
      }),
      { description: 'Road segments that make up the route - think "take 5 to 405 to PCH"' },
    ),
    anchorPoints: Type.Array(
      Type.Object({
        name: Type.String({ description: 'Name of the waypoint (e.g., "Half Moon Bay", "Junction 92")' }),
        kind: Type.Union([
          Type.Literal('town'),
          Type.Literal('junction'),
          Type.Literal('landmark'),
          Type.Literal('pass'),
        ], { description: 'Type of waypoint' }),
        lat: Type.Union([Type.Number(), Type.Null()], { description: 'Latitude if known, otherwise null' }),
        lng: Type.Union([Type.Number(), Type.Null()], { description: 'Longitude if known, otherwise null' }),
      }),
      { description: 'Key waypoints along the route (cities, junctions, landmarks, mountain passes)' },
    ),
  }),

  compileSketch: Type.Object({
    start: Type.Object({
      lat: Type.Number({ description: 'Starting latitude in decimal degrees' }),
      lng: Type.Number({ description: 'Starting longitude in decimal degrees' }),
      label: Type.Union([Type.String(), Type.Null()], {
        description: 'Human-readable name of the starting point, or null if unknown',
      }),
    }),
    end: Type.Object({
      lat: Type.Number({ description: 'Destination latitude in decimal degrees' }),
      lng: Type.Number({ description: 'Destination longitude in decimal degrees' }),
      label: Type.Union([Type.String(), Type.Null()], {
        description: 'Human-readable name of the destination, or null if unknown',
      }),
    }),
    departureTime: Type.Integer({
      description: 'Departure time as unix timestamp in milliseconds. Default to Date.now() + 3600000 (1 hour from now) when not specified by the rider.',
    }),
    preferences: Type.Object({
      scenicBias: Type.Union(
        [Type.Literal('default'), Type.Literal('high')],
        { description: 'Use "high" when the rider asks for scenic/twisty/backroads, "default" otherwise' },
      ),
      avoidHighways: Type.Boolean({
        description: 'True when the rider wants to avoid highways/interstates',
      }),
      avoidTolls: Type.Boolean({
        description: 'True when the rider wants to avoid toll roads',
      }),
    }),
    sketch: Type.Object({
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
  }),

  planRoute: Type.Object({
    start: Type.Object({
      lat: Type.Number({ description: 'Starting latitude in decimal degrees' }),
      lng: Type.Number({ description: 'Starting longitude in decimal degrees' }),
      label: Type.Union([Type.String(), Type.Null()], {
        description: 'Human-readable name of the starting point, or null if unknown',
      }),
    }),
    end: Type.Object({
      lat: Type.Number({ description: 'Destination latitude in decimal degrees' }),
      lng: Type.Number({ description: 'Destination longitude in decimal degrees' }),
      label: Type.Union([Type.String(), Type.Null()], {
        description: 'Human-readable name of the destination, or null if unknown',
      }),
    }),
    departureTime: Type.Integer({
      description:
        'Departure time as unix timestamp in milliseconds. Default to Date.now() + 3600000 (1 hour from now) when not specified by the rider.',
    }),
    preferences: Type.Object({
      scenicBias: Type.Union(
        [Type.Literal('default'), Type.Literal('high')],
        { description: 'Use "high" when the rider asks for scenic/twisty/backroads, "default" otherwise' },
      ),
      avoidHighways: Type.Boolean({
        description: 'True when the rider wants to avoid highways/interstates',
      }),
      avoidTolls: Type.Boolean({
        description: 'True when the rider wants to avoid toll roads',
      }),
    }),
  }),

  fetchWeather: Type.Object({
    location: Type.Union([Type.String(), Type.Null()], {
      description: 'Optional place name to check weather for; null for current route',
    }),
  }),

  saveRoute: Type.Object({
    routeIndex: Type.Union([Type.Integer(), Type.Null()], {
      description: '0-based index of which route option to save; null to save the best one',
    }),
    name: Type.Union([Type.String(), Type.Null()], {
      description: 'Custom name for the saved route; null to auto-generate',
    }),
  }),

  searchFavorites: Type.Object({
    query: Type.String({ description: 'Search query to filter saved routes' }),
  }),

  getUserFavorites: Type.Object({
    bbox: Type.Object({
      north: Type.Number({ description: 'Northern latitude boundary of the region in decimal degrees' }),
      south: Type.Number({ description: 'Southern latitude boundary of the region in decimal degrees' }),
      east: Type.Number({ description: 'Eastern longitude boundary of the region in decimal degrees' }),
      west: Type.Number({ description: 'Western longitude boundary of the region in decimal degrees' }),
    }, { description: 'Geographic bounding box of the planned route region' }),
  }),

  getElevation: Type.Object({
    polyline: Type.Array(
      Type.Object({
        lat: Type.Number({ description: 'Latitude in decimal degrees' }),
        lng: Type.Number({ description: 'Longitude in decimal degrees' }),
      }),
      {
        description:
          'Array of lat/lng points representing the route polyline. Sampled at ~500m intervals; max 100 points sent to API.',
      }
    ),
  }),

  lookupRoad: Type.Object({
    roadName: Type.String({
      description: 'Road name to look up in OSM (e.g. "Highway 1", "Pacific Coast Highway")',
    }),
    bbox: Type.Object({
      south: Type.Number({ description: 'Southern latitude boundary in decimal degrees' }),
      west: Type.Number({ description: 'Western longitude boundary in decimal degrees' }),
      north: Type.Number({ description: 'Northern latitude boundary in decimal degrees' }),
      east: Type.Number({ description: 'Eastern longitude boundary in decimal degrees' }),
    }),
  }),
}

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
