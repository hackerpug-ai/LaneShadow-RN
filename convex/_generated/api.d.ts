/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_agent_agents_discoveryAgent from "../actions/agent/agents/discoveryAgent.js";
import type * as actions_agent_agents_enrichmentAgent from "../actions/agent/agents/enrichmentAgent.js";
import type * as actions_agent_agents_orchestrator from "../actions/agent/agents/orchestrator.js";
import type * as actions_agent_agents_routingAgent from "../actions/agent/agents/routingAgent.js";
import type * as actions_agent_agents_searchAgent from "../actions/agent/agents/searchAgent.js";
import type * as actions_agent_agents_types from "../actions/agent/agents/types.js";
import type * as actions_agent_budgetTracker from "../actions/agent/budgetTracker.js";
import type * as actions_agent_enrichment_runEnrichmentJob from "../actions/agent/enrichment/runEnrichmentJob.js";
import type * as actions_agent_generateTripPlan from "../actions/agent/generateTripPlan.js";
import type * as actions_agent_lib_anchorExtraction from "../actions/agent/lib/anchorExtraction.js";
import type * as actions_agent_lib_endpointParser from "../actions/agent/lib/endpointParser.js";
import type * as actions_agent_lib_enrichmentCache from "../actions/agent/lib/enrichmentCache.js";
import type * as actions_agent_lib_geo from "../actions/agent/lib/geo.js";
import type * as actions_agent_lib_models from "../actions/agent/lib/models.js";
import type * as actions_agent_lib_piTools from "../actions/agent/lib/piTools.js";
import type * as actions_agent_lib_placeAliases from "../actions/agent/lib/placeAliases.js";
import type * as actions_agent_lib_planRideOrchestrator from "../actions/agent/lib/planRideOrchestrator.js";
import type * as actions_agent_lib_planningEvents from "../actions/agent/lib/planningEvents.js";
import type * as actions_agent_lib_reliability from "../actions/agent/lib/reliability.js";
import type * as actions_agent_lib_summarizeForContext from "../actions/agent/lib/summarizeForContext.js";
import type * as actions_agent_lib_summarizeToolResult from "../actions/agent/lib/summarizeToolResult.js";
import type * as actions_agent_lib_tracing from "../actions/agent/lib/tracing.js";
import type * as actions_agent_lib_zaiProvider from "../actions/agent/lib/zaiProvider.js";
import type * as actions_agent_loopDetector from "../actions/agent/loopDetector.js";
import type * as actions_agent_planRide from "../actions/agent/planRide.js";
import type * as actions_agent_providers_geocodingProvider from "../actions/agent/providers/geocodingProvider.js";
import type * as actions_agent_providers_placesProvider from "../actions/agent/providers/placesProvider.js";
import type * as actions_agent_providers_protomapsProvider from "../actions/agent/providers/protomapsProvider.js";
import type * as actions_agent_providers_routingProvider from "../actions/agent/providers/routingProvider.js";
import type * as actions_agent_providers_waypointService from "../actions/agent/providers/waypointService.js";
import type * as actions_agent_providers_weatherProvider from "../actions/agent/providers/weatherProvider.js";
import type * as actions_agent_providers_webSearchProvider from "../actions/agent/providers/webSearchProvider.js";
import type * as actions_agent_ridePlanningAgent from "../actions/agent/ridePlanningAgent.js";
import type * as actions_agent_runAgent from "../actions/agent/runAgent.js";
import type * as actions_agent_sendMessage from "../actions/agent/sendMessage.js";
import type * as actions_agent_sessionContext from "../actions/agent/sessionContext.js";
import type * as actions_agent_spike_rideAgentSpike from "../actions/agent/spike/rideAgentSpike.js";
import type * as actions_agent_spike_rideAgentSpikeAction from "../actions/agent/spike/rideAgentSpikeAction.js";
import type * as actions_agent_spike_spikeObservability from "../actions/agent/spike/spikeObservability.js";
import type * as actions_agent_spike_spikeTools from "../actions/agent/spike/spikeTools.js";
import type * as actions_agent_tools_checkSurface from "../actions/agent/tools/checkSurface.js";
import type * as actions_agent_tools_compileSketch from "../actions/agent/tools/compileSketch.js";
import type * as actions_agent_tools_computeRouteIndex from "../actions/agent/tools/computeRouteIndex.js";
import type * as actions_agent_tools_discoverCuratedRoutes from "../actions/agent/tools/discoverCuratedRoutes.js";
import type * as actions_agent_tools_discoverCuratedRoutesLiveTest from "../actions/agent/tools/discoverCuratedRoutesLiveTest.js";
import type * as actions_agent_tools_enrichRoute from "../actions/agent/tools/enrichRoute.js";
import type * as actions_agent_tools_findScenicWaypoints from "../actions/agent/tools/findScenicWaypoints.js";
import type * as actions_agent_tools_getCurvature from "../actions/agent/tools/getCurvature.js";
import type * as actions_agent_tools_getElevation from "../actions/agent/tools/getElevation.js";
import type * as actions_agent_tools_getRouteWeather from "../actions/agent/tools/getRouteWeather.js";
import type * as actions_agent_tools_getUserFavorites from "../actions/agent/tools/getUserFavorites.js";
import type * as actions_agent_tools_lookupRoad from "../actions/agent/tools/lookupRoad.js";
import type * as actions_agent_tools_manageWaypoints from "../actions/agent/tools/manageWaypoints.js";
import type * as actions_agent_tools_mapConditions from "../actions/agent/tools/mapConditions.js";
import type * as actions_agent_tools_normalizeRoute from "../actions/agent/tools/normalizeRoute.js";
import type * as actions_agent_tools_probeConditions from "../actions/agent/tools/probeConditions.js";
import type * as actions_agent_tools_searchAlongRoute from "../actions/agent/tools/searchAlongRoute.js";
import type * as actions_agent_tools_searchNearby from "../actions/agent/tools/searchNearby.js";
import type * as actions_agent_tools_webSearch from "../actions/agent/tools/webSearch.js";
import type * as actions_curatedGeometry from "../actions/curatedGeometry.js";
import type * as actions_curatedGeometryReconstruct from "../actions/curatedGeometryReconstruct.js";
import type * as actions_curation_intentExtraction from "../actions/curation/intentExtraction.js";
import type * as actions_mapData from "../actions/mapData.js";
import type * as actions_monitoring from "../actions/monitoring.js";
import type * as actions_osm from "../actions/osm.js";
import type * as actions_places from "../actions/places.js";
import type * as actions_rideWorthinessClassifier from "../actions/rideWorthinessClassifier.js";
import type * as actions_users from "../actions/users.js";
import type * as actions_weather from "../actions/weather.js";
import type * as crons from "../crons.js";
import type * as curatedGeometry from "../curatedGeometry.js";
import type * as curatedGeometryGate from "../curatedGeometryGate.js";
import type * as curatedGeometryHygiene from "../curatedGeometryHygiene.js";
import type * as curatedGeometryQa from "../curatedGeometryQa.js";
import type * as curatedGeometryReconstruct from "../curatedGeometryReconstruct.js";
import type * as curatedGeometryTestSupport from "../curatedGeometryTestSupport.js";
import type * as curatedRouteStateCounts from "../curatedRouteStateCounts.js";
import type * as curatedRoutes from "../curatedRoutes.js";
import type * as curationAdmin from "../curationAdmin.js";
import type * as curationArtifacts from "../curationArtifacts.js";
import type * as curationMetrics from "../curationMetrics.js";
import type * as db_clerkSync from "../db/clerkSync.js";
import type * as db_curation from "../db/curation.js";
import type * as db_favoriteRoads from "../db/favoriteRoads.js";
import type * as db_favorites from "../db/favorites.js";
import type * as db_osm from "../db/osm.js";
import type * as db_performance from "../db/performance.js";
import type * as db_planUsage from "../db/planUsage.js";
import type * as db_planningSessions from "../db/planningSessions.js";
import type * as db_routeEnrichments from "../db/routeEnrichments.js";
import type * as db_routeFeedback from "../db/routeFeedback.js";
import type * as db_routePlans from "../db/routePlans.js";
import type * as db_routesPlan from "../db/routesPlan.js";
import type * as db_savedRoutes from "../db/savedRoutes.js";
import type * as db_sessionMessages from "../db/sessionMessages.js";
import type * as db_tripPlans from "../db/tripPlans.js";
import type * as db_users from "../db/users.js";
import type * as db_waypoints from "../db/waypoints.js";
import type * as errors from "../errors.js";
import type * as geospatialIndex from "../geospatialIndex.js";
import type * as geospatialSeed from "../geospatialSeed.js";
import type * as geospatialValidation from "../geospatialValidation.js";
import type * as guards from "../guards.js";
import type * as http from "../http.js";
import type * as lib_conversationalErrors from "../lib/conversationalErrors.js";
import type * as lib_endpointParser from "../lib/endpointParser.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_errors_protomaps from "../lib/errors/protomaps.js";
import type * as lib_logger from "../lib/logger.js";
import type * as migrations_backfillSessionMessageKindStatus from "../migrations/backfillSessionMessageKindStatus.js";
import type * as migrations_deleteEmptyAssistantMessages from "../migrations/deleteEmptyAssistantMessages.js";
import type * as queries_osm from "../queries/osm.js";
import type * as reviewQueue from "../reviewQueue.js";
import type * as seedGeospatialTest from "../seedGeospatialTest.js";
import type * as semanticSearch from "../semanticSearch.js";
import type * as types from "../types.js";
import type * as users from "../users.js";
import type * as util_archetypeMap from "../util/archetypeMap.js";
import type * as util_dataNormalization from "../util/dataNormalization.js";
import type * as waterfallOrchestrator from "../waterfallOrchestrator.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/agent/agents/discoveryAgent": typeof actions_agent_agents_discoveryAgent;
  "actions/agent/agents/enrichmentAgent": typeof actions_agent_agents_enrichmentAgent;
  "actions/agent/agents/orchestrator": typeof actions_agent_agents_orchestrator;
  "actions/agent/agents/routingAgent": typeof actions_agent_agents_routingAgent;
  "actions/agent/agents/searchAgent": typeof actions_agent_agents_searchAgent;
  "actions/agent/agents/types": typeof actions_agent_agents_types;
  "actions/agent/budgetTracker": typeof actions_agent_budgetTracker;
  "actions/agent/enrichment/runEnrichmentJob": typeof actions_agent_enrichment_runEnrichmentJob;
  "actions/agent/generateTripPlan": typeof actions_agent_generateTripPlan;
  "actions/agent/lib/anchorExtraction": typeof actions_agent_lib_anchorExtraction;
  "actions/agent/lib/endpointParser": typeof actions_agent_lib_endpointParser;
  "actions/agent/lib/enrichmentCache": typeof actions_agent_lib_enrichmentCache;
  "actions/agent/lib/geo": typeof actions_agent_lib_geo;
  "actions/agent/lib/models": typeof actions_agent_lib_models;
  "actions/agent/lib/piTools": typeof actions_agent_lib_piTools;
  "actions/agent/lib/placeAliases": typeof actions_agent_lib_placeAliases;
  "actions/agent/lib/planRideOrchestrator": typeof actions_agent_lib_planRideOrchestrator;
  "actions/agent/lib/planningEvents": typeof actions_agent_lib_planningEvents;
  "actions/agent/lib/reliability": typeof actions_agent_lib_reliability;
  "actions/agent/lib/summarizeForContext": typeof actions_agent_lib_summarizeForContext;
  "actions/agent/lib/summarizeToolResult": typeof actions_agent_lib_summarizeToolResult;
  "actions/agent/lib/tracing": typeof actions_agent_lib_tracing;
  "actions/agent/lib/zaiProvider": typeof actions_agent_lib_zaiProvider;
  "actions/agent/loopDetector": typeof actions_agent_loopDetector;
  "actions/agent/planRide": typeof actions_agent_planRide;
  "actions/agent/providers/geocodingProvider": typeof actions_agent_providers_geocodingProvider;
  "actions/agent/providers/placesProvider": typeof actions_agent_providers_placesProvider;
  "actions/agent/providers/protomapsProvider": typeof actions_agent_providers_protomapsProvider;
  "actions/agent/providers/routingProvider": typeof actions_agent_providers_routingProvider;
  "actions/agent/providers/waypointService": typeof actions_agent_providers_waypointService;
  "actions/agent/providers/weatherProvider": typeof actions_agent_providers_weatherProvider;
  "actions/agent/providers/webSearchProvider": typeof actions_agent_providers_webSearchProvider;
  "actions/agent/ridePlanningAgent": typeof actions_agent_ridePlanningAgent;
  "actions/agent/runAgent": typeof actions_agent_runAgent;
  "actions/agent/sendMessage": typeof actions_agent_sendMessage;
  "actions/agent/sessionContext": typeof actions_agent_sessionContext;
  "actions/agent/spike/rideAgentSpike": typeof actions_agent_spike_rideAgentSpike;
  "actions/agent/spike/rideAgentSpikeAction": typeof actions_agent_spike_rideAgentSpikeAction;
  "actions/agent/spike/spikeObservability": typeof actions_agent_spike_spikeObservability;
  "actions/agent/spike/spikeTools": typeof actions_agent_spike_spikeTools;
  "actions/agent/tools/checkSurface": typeof actions_agent_tools_checkSurface;
  "actions/agent/tools/compileSketch": typeof actions_agent_tools_compileSketch;
  "actions/agent/tools/computeRouteIndex": typeof actions_agent_tools_computeRouteIndex;
  "actions/agent/tools/discoverCuratedRoutes": typeof actions_agent_tools_discoverCuratedRoutes;
  "actions/agent/tools/discoverCuratedRoutesLiveTest": typeof actions_agent_tools_discoverCuratedRoutesLiveTest;
  "actions/agent/tools/enrichRoute": typeof actions_agent_tools_enrichRoute;
  "actions/agent/tools/findScenicWaypoints": typeof actions_agent_tools_findScenicWaypoints;
  "actions/agent/tools/getCurvature": typeof actions_agent_tools_getCurvature;
  "actions/agent/tools/getElevation": typeof actions_agent_tools_getElevation;
  "actions/agent/tools/getRouteWeather": typeof actions_agent_tools_getRouteWeather;
  "actions/agent/tools/getUserFavorites": typeof actions_agent_tools_getUserFavorites;
  "actions/agent/tools/lookupRoad": typeof actions_agent_tools_lookupRoad;
  "actions/agent/tools/manageWaypoints": typeof actions_agent_tools_manageWaypoints;
  "actions/agent/tools/mapConditions": typeof actions_agent_tools_mapConditions;
  "actions/agent/tools/normalizeRoute": typeof actions_agent_tools_normalizeRoute;
  "actions/agent/tools/probeConditions": typeof actions_agent_tools_probeConditions;
  "actions/agent/tools/searchAlongRoute": typeof actions_agent_tools_searchAlongRoute;
  "actions/agent/tools/searchNearby": typeof actions_agent_tools_searchNearby;
  "actions/agent/tools/webSearch": typeof actions_agent_tools_webSearch;
  "actions/curatedGeometry": typeof actions_curatedGeometry;
  "actions/curatedGeometryReconstruct": typeof actions_curatedGeometryReconstruct;
  "actions/curation/intentExtraction": typeof actions_curation_intentExtraction;
  "actions/mapData": typeof actions_mapData;
  "actions/monitoring": typeof actions_monitoring;
  "actions/osm": typeof actions_osm;
  "actions/places": typeof actions_places;
  "actions/rideWorthinessClassifier": typeof actions_rideWorthinessClassifier;
  "actions/users": typeof actions_users;
  "actions/weather": typeof actions_weather;
  crons: typeof crons;
  curatedGeometry: typeof curatedGeometry;
  curatedGeometryGate: typeof curatedGeometryGate;
  curatedGeometryHygiene: typeof curatedGeometryHygiene;
  curatedGeometryQa: typeof curatedGeometryQa;
  curatedGeometryReconstruct: typeof curatedGeometryReconstruct;
  curatedGeometryTestSupport: typeof curatedGeometryTestSupport;
  curatedRouteStateCounts: typeof curatedRouteStateCounts;
  curatedRoutes: typeof curatedRoutes;
  curationAdmin: typeof curationAdmin;
  curationArtifacts: typeof curationArtifacts;
  curationMetrics: typeof curationMetrics;
  "db/clerkSync": typeof db_clerkSync;
  "db/curation": typeof db_curation;
  "db/favoriteRoads": typeof db_favoriteRoads;
  "db/favorites": typeof db_favorites;
  "db/osm": typeof db_osm;
  "db/performance": typeof db_performance;
  "db/planUsage": typeof db_planUsage;
  "db/planningSessions": typeof db_planningSessions;
  "db/routeEnrichments": typeof db_routeEnrichments;
  "db/routeFeedback": typeof db_routeFeedback;
  "db/routePlans": typeof db_routePlans;
  "db/routesPlan": typeof db_routesPlan;
  "db/savedRoutes": typeof db_savedRoutes;
  "db/sessionMessages": typeof db_sessionMessages;
  "db/tripPlans": typeof db_tripPlans;
  "db/users": typeof db_users;
  "db/waypoints": typeof db_waypoints;
  errors: typeof errors;
  geospatialIndex: typeof geospatialIndex;
  geospatialSeed: typeof geospatialSeed;
  geospatialValidation: typeof geospatialValidation;
  guards: typeof guards;
  http: typeof http;
  "lib/conversationalErrors": typeof lib_conversationalErrors;
  "lib/endpointParser": typeof lib_endpointParser;
  "lib/env": typeof lib_env;
  "lib/errors/protomaps": typeof lib_errors_protomaps;
  "lib/logger": typeof lib_logger;
  "migrations/backfillSessionMessageKindStatus": typeof migrations_backfillSessionMessageKindStatus;
  "migrations/deleteEmptyAssistantMessages": typeof migrations_deleteEmptyAssistantMessages;
  "queries/osm": typeof queries_osm;
  reviewQueue: typeof reviewQueue;
  seedGeospatialTest: typeof seedGeospatialTest;
  semanticSearch: typeof semanticSearch;
  types: typeof types;
  users: typeof users;
  "util/archetypeMap": typeof util_archetypeMap;
  "util/dataNormalization": typeof util_dataNormalization;
  waterfallOrchestrator: typeof waterfallOrchestrator;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  geospatial: {
    document: {
      get: FunctionReference<
        "query",
        "internal",
        { key: string },
        {
          coordinates: { latitude: number; longitude: number };
          filterKeys: Record<
            string,
            | string
            | number
            | boolean
            | null
            | bigint
            | Array<string | number | boolean | null | bigint>
          >;
          key: string;
          sortKey: number;
        } | null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        {
          document: {
            coordinates: { latitude: number; longitude: number };
            filterKeys: Record<
              string,
              | string
              | number
              | boolean
              | null
              | bigint
              | Array<string | number | boolean | null | bigint>
            >;
            key: string;
            sortKey: number;
          };
          levelMod: number;
          maxCells: number;
          maxLevel: number;
          minLevel: number;
        },
        null
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        {
          key: string;
          levelMod: number;
          maxCells: number;
          maxLevel: number;
          minLevel: number;
        },
        boolean
      >;
    };
    query: {
      debugCells: FunctionReference<
        "query",
        "internal",
        {
          levelMod: number;
          maxCells: number;
          maxLevel: number;
          minLevel: number;
          rectangle: {
            east: number;
            north: number;
            south: number;
            west: number;
          };
        },
        Array<{
          token: string;
          vertices: Array<{ latitude: number; longitude: number }>;
        }>
      >;
      execute: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          levelMod: number;
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          maxCells: number;
          maxLevel: number;
          minLevel: number;
          query: {
            filtering: Array<{
              filterKey: string;
              filterValue: string | number | boolean | null | bigint;
              occur: "should" | "must";
            }>;
            maxResults: number;
            rectangle: {
              east: number;
              north: number;
              south: number;
              west: number;
            };
            sorting: {
              interval: { endExclusive?: number; startInclusive?: number };
            };
          };
        },
        {
          nextCursor?: string;
          results: Array<{
            coordinates: { latitude: number; longitude: number };
            key: string;
          }>;
        }
      >;
      nearestPoints: FunctionReference<
        "query",
        "internal",
        {
          filtering: Array<{
            filterKey: string;
            filterValue: string | number | boolean | null | bigint;
            occur: "should" | "must";
          }>;
          levelMod: number;
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          maxDistance?: number;
          maxLevel: number;
          maxResults: number;
          minLevel: number;
          nextCursor?: string;
          point: { latitude: number; longitude: number };
          sorting: {
            interval: { endExclusive?: number; startInclusive?: number };
          };
        },
        Array<{
          coordinates: { latitude: number; longitude: number };
          distance: number;
          key: string;
        }>
      >;
    };
  };
};
