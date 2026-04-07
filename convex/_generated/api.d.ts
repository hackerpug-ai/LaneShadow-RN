/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_agent_agents_enrichmentAgent from "../actions/agent/agents/enrichmentAgent.js";
import type * as actions_agent_agents_routingAgent from "../actions/agent/agents/routingAgent.js";
import type * as actions_agent_agents_types from "../actions/agent/agents/types.js";
import type * as actions_agent_budgetTracker from "../actions/agent/budgetTracker.js";
import type * as actions_agent_lib_geo from "../actions/agent/lib/geo.js";
import type * as actions_agent_lib_piTools from "../actions/agent/lib/piTools.js";
import type * as actions_agent_lib_planRideOrchestrator from "../actions/agent/lib/planRideOrchestrator.js";
import type * as actions_agent_lib_reliability from "../actions/agent/lib/reliability.js";
import type * as actions_agent_lib_summarizeForContext from "../actions/agent/lib/summarizeForContext.js";
import type * as actions_agent_lib_tracing from "../actions/agent/lib/tracing.js";
import type * as actions_agent_loopDetector from "../actions/agent/loopDetector.js";
import type * as actions_agent_planRide from "../actions/agent/planRide.js";
import type * as actions_agent_providers_geocodingProvider from "../actions/agent/providers/geocodingProvider.js";
import type * as actions_agent_providers_placesProvider from "../actions/agent/providers/placesProvider.js";
import type * as actions_agent_providers_routingProvider from "../actions/agent/providers/routingProvider.js";
import type * as actions_agent_providers_weatherProvider from "../actions/agent/providers/weatherProvider.js";
import type * as actions_agent_providers_webSearchProvider from "../actions/agent/providers/webSearchProvider.js";
import type * as actions_agent_ridePlanningAgent from "../actions/agent/ridePlanningAgent.js";
import type * as actions_agent_runAgent from "../actions/agent/runAgent.js";
import type * as actions_agent_sendMessage from "../actions/agent/sendMessage.js";
import type * as actions_agent_sessionContext from "../actions/agent/sessionContext.js";
import type * as actions_agent_tools_checkSurface from "../actions/agent/tools/checkSurface.js";
import type * as actions_agent_tools_compileSketch from "../actions/agent/tools/compileSketch.js";
import type * as actions_agent_tools_computeRouteIndex from "../actions/agent/tools/computeRouteIndex.js";
import type * as actions_agent_tools_enrichRoute from "../actions/agent/tools/enrichRoute.js";
import type * as actions_agent_tools_findScenicWaypoints from "../actions/agent/tools/findScenicWaypoints.js";
import type * as actions_agent_tools_getCurvature from "../actions/agent/tools/getCurvature.js";
import type * as actions_agent_tools_getElevation from "../actions/agent/tools/getElevation.js";
import type * as actions_agent_tools_getRouteWeather from "../actions/agent/tools/getRouteWeather.js";
import type * as actions_agent_tools_getUserFavorites from "../actions/agent/tools/getUserFavorites.js";
import type * as actions_agent_tools_lookupRoad from "../actions/agent/tools/lookupRoad.js";
import type * as actions_agent_tools_mapConditions from "../actions/agent/tools/mapConditions.js";
import type * as actions_agent_tools_normalizeRoute from "../actions/agent/tools/normalizeRoute.js";
import type * as actions_agent_tools_probeConditions from "../actions/agent/tools/probeConditions.js";
import type * as actions_agent_tools_searchAlongRoute from "../actions/agent/tools/searchAlongRoute.js";
import type * as actions_agent_tools_searchNearby from "../actions/agent/tools/searchNearby.js";
import type * as actions_agent_tools_webSearch from "../actions/agent/tools/webSearch.js";
import type * as actions_users from "../actions/users.js";
import type * as db_clerkSync from "../db/clerkSync.js";
import type * as db_favoriteRoads from "../db/favoriteRoads.js";
import type * as db_planUsage from "../db/planUsage.js";
import type * as db_planningSessions from "../db/planningSessions.js";
import type * as db_routePlans from "../db/routePlans.js";
import type * as db_routesPlan from "../db/routesPlan.js";
import type * as db_savedRoutes from "../db/savedRoutes.js";
import type * as db_sessionMessages from "../db/sessionMessages.js";
import type * as db_users from "../db/users.js";
import type * as errors from "../errors.js";
import type * as guards from "../guards.js";
import type * as http from "../http.js";
import type * as lib_conversationalErrors from "../lib/conversationalErrors.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_logger from "../lib/logger.js";
import type * as migrations_backfillSessionMessageKindStatus from "../migrations/backfillSessionMessageKindStatus.js";
import type * as migrations_deleteEmptyAssistantMessages from "../migrations/deleteEmptyAssistantMessages.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/agent/agents/enrichmentAgent": typeof actions_agent_agents_enrichmentAgent;
  "actions/agent/agents/routingAgent": typeof actions_agent_agents_routingAgent;
  "actions/agent/agents/types": typeof actions_agent_agents_types;
  "actions/agent/budgetTracker": typeof actions_agent_budgetTracker;
  "actions/agent/lib/geo": typeof actions_agent_lib_geo;
  "actions/agent/lib/piTools": typeof actions_agent_lib_piTools;
  "actions/agent/lib/planRideOrchestrator": typeof actions_agent_lib_planRideOrchestrator;
  "actions/agent/lib/reliability": typeof actions_agent_lib_reliability;
  "actions/agent/lib/summarizeForContext": typeof actions_agent_lib_summarizeForContext;
  "actions/agent/lib/tracing": typeof actions_agent_lib_tracing;
  "actions/agent/loopDetector": typeof actions_agent_loopDetector;
  "actions/agent/planRide": typeof actions_agent_planRide;
  "actions/agent/providers/geocodingProvider": typeof actions_agent_providers_geocodingProvider;
  "actions/agent/providers/placesProvider": typeof actions_agent_providers_placesProvider;
  "actions/agent/providers/routingProvider": typeof actions_agent_providers_routingProvider;
  "actions/agent/providers/weatherProvider": typeof actions_agent_providers_weatherProvider;
  "actions/agent/providers/webSearchProvider": typeof actions_agent_providers_webSearchProvider;
  "actions/agent/ridePlanningAgent": typeof actions_agent_ridePlanningAgent;
  "actions/agent/runAgent": typeof actions_agent_runAgent;
  "actions/agent/sendMessage": typeof actions_agent_sendMessage;
  "actions/agent/sessionContext": typeof actions_agent_sessionContext;
  "actions/agent/tools/checkSurface": typeof actions_agent_tools_checkSurface;
  "actions/agent/tools/compileSketch": typeof actions_agent_tools_compileSketch;
  "actions/agent/tools/computeRouteIndex": typeof actions_agent_tools_computeRouteIndex;
  "actions/agent/tools/enrichRoute": typeof actions_agent_tools_enrichRoute;
  "actions/agent/tools/findScenicWaypoints": typeof actions_agent_tools_findScenicWaypoints;
  "actions/agent/tools/getCurvature": typeof actions_agent_tools_getCurvature;
  "actions/agent/tools/getElevation": typeof actions_agent_tools_getElevation;
  "actions/agent/tools/getRouteWeather": typeof actions_agent_tools_getRouteWeather;
  "actions/agent/tools/getUserFavorites": typeof actions_agent_tools_getUserFavorites;
  "actions/agent/tools/lookupRoad": typeof actions_agent_tools_lookupRoad;
  "actions/agent/tools/mapConditions": typeof actions_agent_tools_mapConditions;
  "actions/agent/tools/normalizeRoute": typeof actions_agent_tools_normalizeRoute;
  "actions/agent/tools/probeConditions": typeof actions_agent_tools_probeConditions;
  "actions/agent/tools/searchAlongRoute": typeof actions_agent_tools_searchAlongRoute;
  "actions/agent/tools/searchNearby": typeof actions_agent_tools_searchNearby;
  "actions/agent/tools/webSearch": typeof actions_agent_tools_webSearch;
  "actions/users": typeof actions_users;
  "db/clerkSync": typeof db_clerkSync;
  "db/favoriteRoads": typeof db_favoriteRoads;
  "db/planUsage": typeof db_planUsage;
  "db/planningSessions": typeof db_planningSessions;
  "db/routePlans": typeof db_routePlans;
  "db/routesPlan": typeof db_routesPlan;
  "db/savedRoutes": typeof db_savedRoutes;
  "db/sessionMessages": typeof db_sessionMessages;
  "db/users": typeof db_users;
  errors: typeof errors;
  guards: typeof guards;
  http: typeof http;
  "lib/conversationalErrors": typeof lib_conversationalErrors;
  "lib/env": typeof lib_env;
  "lib/logger": typeof lib_logger;
  "migrations/backfillSessionMessageKindStatus": typeof migrations_backfillSessionMessageKindStatus;
  "migrations/deleteEmptyAssistantMessages": typeof migrations_deleteEmptyAssistantMessages;
  users: typeof users;
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

export declare const components: {};
