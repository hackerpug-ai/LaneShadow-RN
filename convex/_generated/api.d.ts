/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions_agent_graphs_planningGraph from "../actions/agent/graphs/planningGraph.js";
import type * as actions_agent_lib_reliability from "../actions/agent/lib/reliability.js";
import type * as actions_agent_lib_tracing from "../actions/agent/lib/tracing.js";
import type * as actions_agent_planRide from "../actions/agent/planRide.js";
import type * as actions_agent_providers_routingProvider from "../actions/agent/providers/routingProvider.js";
import type * as actions_agent_providers_weatherProvider from "../actions/agent/providers/weatherProvider.js";
import type * as actions_agent_tools_compileSketch from "../actions/agent/tools/compileSketch.js";
import type * as actions_agent_tools_computeRouteIndex from "../actions/agent/tools/computeRouteIndex.js";
import type * as actions_agent_tools_mapConditions from "../actions/agent/tools/mapConditions.js";
import type * as actions_agent_tools_normalizeRoute from "../actions/agent/tools/normalizeRoute.js";
import type * as actions_agent_tools_probeConditions from "../actions/agent/tools/probeConditions.js";
import type * as actions_users from "../actions/users.js";
import type * as db_clerkSync from "../db/clerkSync.js";
import type * as db_routesPlan from "../db/routesPlan.js";
import type * as db_savedRoutes from "../db/savedRoutes.js";
import type * as db_users from "../db/users.js";
import type * as guards from "../guards.js";
import type * as http from "../http.js";
import type * as lib_env from "../lib/env.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/agent/graphs/planningGraph": typeof actions_agent_graphs_planningGraph;
  "actions/agent/lib/reliability": typeof actions_agent_lib_reliability;
  "actions/agent/lib/tracing": typeof actions_agent_lib_tracing;
  "actions/agent/planRide": typeof actions_agent_planRide;
  "actions/agent/providers/routingProvider": typeof actions_agent_providers_routingProvider;
  "actions/agent/providers/weatherProvider": typeof actions_agent_providers_weatherProvider;
  "actions/agent/tools/compileSketch": typeof actions_agent_tools_compileSketch;
  "actions/agent/tools/computeRouteIndex": typeof actions_agent_tools_computeRouteIndex;
  "actions/agent/tools/mapConditions": typeof actions_agent_tools_mapConditions;
  "actions/agent/tools/normalizeRoute": typeof actions_agent_tools_normalizeRoute;
  "actions/agent/tools/probeConditions": typeof actions_agent_tools_probeConditions;
  "actions/users": typeof actions_users;
  "db/clerkSync": typeof db_clerkSync;
  "db/routesPlan": typeof db_routesPlan;
  "db/savedRoutes": typeof db_savedRoutes;
  "db/users": typeof db_users;
  guards: typeof guards;
  http: typeof http;
  "lib/env": typeof lib_env;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
