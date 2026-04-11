# Cerebras vs Haiku — Comparison Summary

Generated: 2026-04-11T22:22:05.655854+00:00

## Scorecard

| Model | Tool-match | Concise | Errors | Avg latency | Total cost |
|---|---|---|---|---|---|
| `llama3.1-8b` | 8/21 | 11/21 | 0/21 | 366 ms | $0.003237 |
| `zai-glm-4.7` | 19/21 | 8/21 | 0/21 | 688 ms | $0.057238 |
| `qwen-3-235b` | 21/21 | 6/21 | 0/21 | 335 ms | $0.013624 |

## Fixture: `enrichment_agent`

### `elevation_climbs` — "any big climbs on this route?"
> Direct mapping from the prompt's tool guide.
**Expected tool**: `getElevation`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"name": "getElevation", "arguments": {"polyline": "[[37.7749, -122.4194], [37.6 | ✗ | 723 ms | $0.000158 |
| `qwen-3-235b` | `getElevation` | `{"polyline": [{"lat": 37.7749, "lng": -122.4194}, {"lat": 37` |  | ✓ | 364 ms | $0.000783 |
| `zai-glm-4.7` | `getElevation` | `{"polyline": [{"lat": 37.7749, "lng": -122.4194}, {"lat": 37` |  | ✓ | 647 ms | $0.002999 |

### `gas_stops` — "where can I stop for gas along the way?"
> Should pass the polyline from route context and query='gas station'.
**Expected tool**: `searchAlongRoute`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"type": "function", "name": "searchAlongRoute", "arguments": {"routePolyline":  | ✗ | 298 ms | $0.000156 |
| `qwen-3-235b` | `searchAlongRoute` | `{"routePolyline": "encoded_polyline_placeholder_abc123", "qu` |  | ✓ | 261 ms | $0.000656 |
| `zai-glm-4.7` | `searchAlongRoute` | `{"routePolyline": "encoded_polyline_placeholder_abc123", "qu` |  | ✓ | 464 ms | $0.002483 |

### `multi_tool_weather_and_gas` — "what's the weather and where can I grab lunch?"
> Two questions in one — should call getRouteWeather AND searchAlongRoute. Tests parallel/sequential tool calling.
**Expected tool**: `getRouteWeather`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `getRouteWeather` | `{"polyline": "[[37.7749, -122.4194], [37.6138, -122.4869], [` |  | ✓ | 282 ms | $0.000160 |
| `qwen-3-235b` | `getRouteWeather` | `{"polyline": [{"lat": 37.7749, "lng": -122.4194}, {"lat": 37` |  | ✓ | 406 ms | $0.000862 |
| `zai-glm-4.7` | `getRouteWeather` | `{"polyline": [{"lat": 37.7749, "lng": -122.4194}, {"lat": 37` | I'll check the weather conditions for your trip and find lunch spots along the r | ✓ | 1361 ms | $0.004127 |

### `saved_roads` — "do I have any favorite roads in this area?"
> Should compute bbox from waypoints.
**Expected tool**: `getUserFavorites`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"name": "getUserFavorites", "arguments": {"bbox": {"north": 38.0, "south": 36.0 | ✗ | 362 ms | $0.000156 |
| `qwen-3-235b` | `getUserFavorites` | `{"bbox": {"north": 37.7749, "south": 36.9741, "east": -122.0` |  | ✓ | 218 ms | $0.000692 |
| `zai-glm-4.7` | `getUserFavorites` | `{"bbox": {"north": 37.8, "south": 36.9, "east": -122.0, "wes` |  | ✓ | 1059 ms | $0.003627 |

### `will_it_rain` — "will it rain tomorrow morning?"
> Departure time is in route context. Should compute departureTimeMs.
**Expected tool**: `getRouteWeather`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"type": "function", "name": "getRouteWeather", "arguments": {"polyline": "[[37. | ✗ | 214 ms | $0.000160 |
| `qwen-3-235b` | `getRouteWeather` | `{"polyline": [{"lat": 37.7749, "lng": -122.4194}, {"lat": 37` |  | ✓ | 380 ms | $0.000805 |
| `zai-glm-4.7` | `getRouteWeather` | `{"polyline": [{"lat": 37.7749, "lng": -122.4194}, {"lat": 37` | I'll check the weather conditions along your route for tomorrow morning at 9:00  | ✓ | 1288 ms | $0.003932 |

## Fixture: `orchestrator`

### `greeting` — "hey there"
> Greeting. Should respond directly without calling any tool.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | Hello! How can I assist you today? | ✓ | 421 ms | $0.000108 |
| `qwen-3-235b` | `—` |  | Hey! Ready for your next ride? Let me know where you'd like to go. | ✓ | 307 ms | $0.000425 |
| `zai-glm-4.7` | `—` |  | Hey! Ready to plan your next ride? Let me know where you'd like to go or what yo | ✓ | 408 ms | $0.001739 |

### `multi_request` — "plan a ride to Napa and tell me if it'll rain"
> Multiple requests. Per prompt: 'handle them one at a time' — should call routing_agent FIRST, then enrichment in a subsequent turn after the route exists.
**Expected tool**: `routing_agent`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `routing_agent` | `{"query": "Napa"}` |  | ✓ | 222 ms | $0.000110 |
| `qwen-3-235b` | `routing_agent` | `{"query": "plan a ride from current location to Napa"}` |  | ✓ | 221 ms | $0.000443 |
| `zai-glm-4.7` | `routing_agent` | `{"query": "plan a ride to Napa"}` | I'll plan your ride to Napa first, then check the weather for you. | ✓ | 622 ms | $0.001965 |

### `nearby_places` — "any good coffee shops near me?"
> POI request → search_agent.
**Expected tool**: `search_agent`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"type": "function", "name": "search_agent", "arguments": {"query": "coffee shop | ✗ | 338 ms | $0.000111 |
| `qwen-3-235b` | `search_agent` | `{"query": "good coffee shops near me"}` |  | ✓ | 324 ms | $0.000434 |
| `zai-glm-4.7` | `search_agent` | `{"query": "good coffee shops near me"}` |  | ✓ | 538 ms | $0.001773 |

### `route_question` — "how much elevation gain on this ride?"
> Question about existing route → enrichment_agent.
**Expected tool**: `enrichment_agent`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"type": "function", "name": "enrichment_agent", "arguments": {"query": "elevati | ✗ | 380 ms | $0.000111 |
| `qwen-3-235b` | `enrichment_agent` | `{"query": "how much elevation gain on this ride?"}` |  | ✓ | 418 ms | $0.000441 |
| `zai-glm-4.7` | `enrichment_agent` | `{"query": "how much elevation gain on this ride?"}` |  | ✓ | 658 ms | $0.001761 |

### `route_request` — "plan me a scenic ride to Santa Cruz"
> Clear route request. Should delegate to routing_agent with query passed through.
**Expected tool**: `routing_agent`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `routing_agent` | `{"query": "scenic ride to Santa Cruz"}` |  | ✓ | 317 ms | $0.000110 |
| `qwen-3-235b` | `routing_agent` | `{"query": "plan a scenic ride to Santa Cruz"}` |  | ✓ | 348 ms | $0.000437 |
| `zai-glm-4.7` | `routing_agent` | `{"query": "plan me a scenic ride to Santa Cruz"}` |  | ✓ | 521 ms | $0.001703 |

### `thanks` — "thanks, that's perfect"
> Acknowledgment. No tool call.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `routing_agent` | `{"query": "thanks, that"}` |  | ✗ | 290 ms | $0.000110 |
| `qwen-3-235b` | `—` |  | You're welcome! Enjoy the ride and stay safe out there. | ✓ | 289 ms | $0.000421 |
| `zai-glm-4.7` | `—` |  | You're welcome! Have a great ride. 🏍️ | ✓ | 513 ms | $0.001735 |

## Fixture: `routing_agent`

### `ambiguous_needs_clarification` — "plan a ride"
> Too vague. Model should either call planRoute with a default or respond with needs_clarification JSON. Either is acceptable — we want to see which it picks.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `planRoute` | `{"start": {"lat": 37.7749, "lng": -122.4194, "label": "Curre` |  | ✗ | 341 ms | $0.000217 |
| `qwen-3-235b` | `—` |  | {"status": "needs_clarification", "question": "Where would you like to ride to?  | ✓ | 407 ms | $0.000945 |
| `zai-glm-4.7` | `—` |  | Where would you like to ride? Tell me a destination, how long you want to be out | ✓ | 596 ms | $0.003753 |

### `avoid_freeway_to_napa` — "I want to ride to Napa but avoid the freeway"
> Avoid constraint → sketch workflow. Should geocode Napa first.
**Expected tool**: `geocode`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `geocode` | `{"query": "Napa"}` |  | ✓ | 520 ms | $0.000213 |
| `qwen-3-235b` | `geocode` | `{"query": "Napa"}` |  | ✓ | 291 ms | $0.000927 |
| `zai-glm-4.7` | `geocode` | `{"query": "Napa"}` |  | ✓ | 572 ms | $0.003725 |

### `scenic_to_santa_cruz` — "scenic ride to Santa Cruz"
> Standard happy path. Should geocode Santa Cruz then call planRoute with the rider's location as start.
**Expected tool**: `geocode`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"type": "function", "name": "geocode", "parameters": {"query": "Santa Cruz"}};  | ✗ | 734 ms | $0.000313 |
| `qwen-3-235b` | `geocode` | `{"query": "Santa Cruz, CA"}` |  | ✓ | 383 ms | $0.000926 |
| `zai-glm-4.7` | `geocode` | `{"query": "Santa Cruz"}` |  | ✓ | 437 ms | $0.003656 |

### `somewhere_fun_2_hours` — "take me somewhere fun for a 2-hour ride"
> No destination — should use planRoute with current location as start and let the orchestrator pick the destination.
**Expected tool**: `planRoute`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `planRoute` | `{"start": {"lat": 37.7749, "lng": -122.4194, "label": "Curre` |  | ✓ | 301 ms | $0.000216 |
| `qwen-3-235b` | `planRoute` | `{"start": {"lat": 37.7749, "lng": -122.4194, "label": "San F` | Your ride starts in San Francisco and can head south along Skyline Boulevard for | ✓ | 442 ms | $0.001080 |
| `zai-glm-4.7` | `geocode` | `{"query": "Point Reyes National Seashore"}` |  | ✗ | 990 ms | $0.004022 |

### `take_hwy1_south` — "take Highway 1 south for about 2 hours"
> Rider names a specific road — should use sketch workflow, not planRoute.
**Expected tool**: `createRouteSketch`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"type": "function", "name": "geocode", "parameters": {"query": "Highway 1"}} | ✗ | 283 ms | $0.000214 |
| `qwen-3-235b` | `createRouteSketch` | `{"segments": [{"roadName": "Highway 1", "fromName": "San Fra` |  | ✓ | 296 ms | $0.000956 |
| `zai-glm-4.7` | `geocode` | `{"query": "Santa Cruz, CA"}` | I'll map out a 2-hour ride south on Highway 1 for you. Let me find a good endpoi | ✗ | 894 ms | $0.004383 |

## Fixture: `search_agent`

### `abs_light` — "what does a blinking ABS light mean on my bike?"
> General motorcycle knowledge. No tool call expected.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | A blinking ABS light typically indicates that the Anti-lock Braking System is ma | ✓ | 287 ms | $0.000122 |
| `qwen-3-235b` | `—` |  | A blinking ABS light typically indicates a fault in the ABS system, such as a se | ✓ | 341 ms | $0.000488 |
| `zai-glm-4.7` | `—` |  | A blinking ABS light typically indicates a fault in your ABS system — the comput | ✓ | 702 ms | $0.002226 |

### `gas_station_nearby` — "any gas stations around here?"
> Happy path POI lookup. Should use rider's current location as center.
**Expected tool**: `searchNearby`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"type": "function", "name": "searchNearby", "arguments": {"query": "gas station | ✗ | 261 ms | $0.000121 |
| `qwen-3-235b` | `searchNearby` | `{"query": "gas station", "location": {"lat": 37.7749, "lng":` |  | ✓ | 373 ms | $0.000494 |
| `zai-glm-4.7` | `searchNearby` | `{"query": "gas station", "location": {"lat": 37.7749, "lng":` |  | ✓ | 463 ms | $0.001918 |

### `general_knowledge_tank` — "how many gallons does a typical sport touring motorcycle tank hold?"
> General knowledge — model should answer directly without calling tools. This is a TRAP — Haiku often over-calls webSearch here. llama3.1-8b may do the same.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | Most sport touring motorcycles have fuel tanks that hold between 4.5 and 6 gallo | ✓ | 285 ms | $0.000122 |
| `qwen-3-235b` | `—` |  | A typical sport-touring motorcycle tank holds between 5 to 7 gallons of fuel, pr | ✓ | 373 ms | $0.000475 |
| `zai-glm-4.7` | `—` |  | A typical sport touring motorcycle tank holds between 5.5 to 6.6 gallons (21-25  | ✓ | 715 ms | $0.002000 |

### `road_closures_hwy1` — "are there any road closures on Highway 1 right now?"
> Current/real-time info → webSearch.
**Expected tool**: `webSearch`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"type": "function", "name": "webSearch", "arguments": {"query": "Highway 1 road | ✗ | 449 ms | $0.000120 |
| `qwen-3-235b` | `webSearch` | `{"query": "current road closures on Highway 1 California"}` |  | ✓ | 346 ms | $0.000469 |
| `zai-glm-4.7` | `webSearch` | `{"query": "Highway 1 road closures current"}` |  | ✓ | 612 ms | $0.001890 |

### `viewpoints_near_carmel` — "any good viewpoints near Carmel?"
> Named location → geocode first, then searchNearby.
**Expected tool**: `geocode`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `llama3.1-8b` | `—` |  | {"type": "function", "name": "geocode", "arguments": {"query": "Carmel, CA"}}; { | ✗ | 390 ms | $0.000129 |
| `qwen-3-235b` | `geocode` | `{"query": "Carmel, CA"}` |  | ✓ | 265 ms | $0.000462 |
| `zai-glm-4.7` | `geocode` | `{"query": "Carmel, CA"}` |  | ✓ | 397 ms | $0.001818 |
