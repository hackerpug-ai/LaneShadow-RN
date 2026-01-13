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
import type * as actions_agent_lib_reliability from "../actions/agent/lib/reliability.js";
import type * as actions_agent_providers_routing_provider from "../actions/agent/providers/routing_provider.js";
import type * as actions_agent_providers_weather_provider from "../actions/agent/providers/weather_provider.js";
import type * as actions_agent_tools_compile_sketch from "../actions/agent/tools/compile_sketch.js";
import type * as actions_agent_tools_compute_route_index from "../actions/agent/tools/compute_route_index.js";
import type * as actions_agent_tools_map_conditions from "../actions/agent/tools/map_conditions.js";
import type * as actions_agent_tools_normalize_route from "../actions/agent/tools/normalize_route.js";
import type * as actions_agent_tools_probe_conditions from "../actions/agent/tools/probe_conditions.js";
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
  "actions/agent/lib/reliability": typeof actions_agent_lib_reliability;
  "actions/agent/providers/routing_provider": typeof actions_agent_providers_routing_provider;
  "actions/agent/providers/weather_provider": typeof actions_agent_providers_weather_provider;
  "actions/agent/tools/compile_sketch": typeof actions_agent_tools_compile_sketch;
  "actions/agent/tools/compute_route_index": typeof actions_agent_tools_compute_route_index;
  "actions/agent/tools/map_conditions": typeof actions_agent_tools_map_conditions;
  "actions/agent/tools/normalize_route": typeof actions_agent_tools_normalize_route;
  "actions/agent/tools/probe_conditions": typeof actions_agent_tools_probe_conditions;
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
