# Cerebras vs Haiku — Comparison Summary

Generated: 2026-04-11T22:26:59.578232+00:00

## Scorecard

| Model | Tool-match | Concise | Errors | Avg latency | Total cost |
|---|---|---|---|---|---|
| `gpt-oss-120b` | 18/21 | 6/21 | 0/21 | 533 ms | $0.008724 |

## Fixture: `enrichment_agent`

### `elevation_climbs` — "any big climbs on this route?"
> Direct mapping from the prompt's tool guide.
**Expected tool**: `getElevation`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `getElevation` | `{"polyline": [{"lat": 37.7749, "lng": -122.4194}, {"lat": 37` |  | ✓ | 426 ms | $0.000386 |

### `gas_stops` — "where can I stop for gas along the way?"
> Should pass the polyline from route context and query='gas station'.
**Expected tool**: `searchAlongRoute`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `searchAlongRoute` | `{"routePolyline": "encoded_polyline_placeholder_abc123", "qu` |  | ✓ | 253 ms | $0.000297 |

### `multi_tool_weather_and_gas` — "what's the weather and where can I grab lunch?"
> Two questions in one — should call getRouteWeather AND searchAlongRoute. Tests parallel/sequential tool calling.
**Expected tool**: `getRouteWeather`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `getRouteWeather` | `{"polyline": [{"lat": 37.7749, "lng": -122.4194}, {"lat": 37` |  | ✓ | 1954 ms | $0.000960 |

### `saved_roads` — "do I have any favorite roads in this area?"
> Should compute bbox from waypoints.
**Expected tool**: `getUserFavorites`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `getUserFavorites` | `{"bbox": {"north": 38, "south": 36.5, "east": -122, "west": ` |  | ✓ | 691 ms | $0.000344 |

### `will_it_rain` — "will it rain tomorrow morning?"
> Departure time is in route context. Should compute departureTimeMs.
**Expected tool**: `getRouteWeather`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `getRouteWeather` | `{"polyline": [{"lat": 37.7749, "lng": -122.4194}, {"lat": 37` |  | ✓ | 856 ms | $0.000790 |

## Fixture: `orchestrator`

### `greeting` — "hey there"
> Greeting. Should respond directly without calling any tool.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `—` |  | Hey! How can I help you plan your next ride? | ✓ | 309 ms | $0.000233 |

### `multi_request` — "plan a ride to Napa and tell me if it'll rain"
> Multiple requests. Per prompt: 'handle them one at a time' — should call routing_agent FIRST, then enrichment in a subsequent turn after the route exists.
**Expected tool**: `routing_agent`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `routing_agent` | `{"query": "Plan a ride to Napa"}` |  | ✓ | 394 ms | $0.000330 |

### `nearby_places` — "any good coffee shops near me?"
> POI request → search_agent.
**Expected tool**: `search_agent`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `search_agent` | `{"query": "good coffee shops near 37.7749,-122.4194"}` |  | ✓ | 415 ms | $0.000266 |

### `route_question` — "how much elevation gain on this ride?"
> Question about existing route → enrichment_agent.
**Expected tool**: `enrichment_agent`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `—` |  | Which ride are you referring to? Let me know the destination or route you have i | ✗ | 344 ms | $0.000355 |

### `route_request` — "plan me a scenic ride to Santa Cruz"
> Clear route request. Should delegate to routing_agent with query passed through.
**Expected tool**: `routing_agent`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `routing_agent` | `{"query": "Plan a scenic ride from San Francisco (37.7749,-1` |  | ✓ | 247 ms | $0.000259 |

### `thanks` — "thanks, that's perfect"
> Acknowledgment. No tool call.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `—` |  | You’re welcome! Enjoy the ride and stay safe out there. | ✓ | 365 ms | $0.000244 |

## Fixture: `routing_agent`

### `ambiguous_needs_clarification` — "plan a ride"
> Too vague. Model should either call planRoute with a default or respond with needs_clarification JSON. Either is acceptable — we want to see which it picks.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `—` |  | {"status": "needs_clarification", "question": "Where would you like to ride to,  | ✓ | 324 ms | $0.000490 |

### `avoid_freeway_to_napa` — "I want to ride to Napa but avoid the freeway"
> Avoid constraint → sketch workflow. Should geocode Napa first.
**Expected tool**: `geocode`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `geocode` | `{"query": "Napa, CA"}` |  | ✓ | 625 ms | $0.000805 |

### `scenic_to_santa_cruz` — "scenic ride to Santa Cruz"
> Standard happy path. Should geocode Santa Cruz then call planRoute with the rider's location as start.
**Expected tool**: `geocode`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `geocode` | `{"query": "Santa Cruz, CA"}` |  | ✓ | 278 ms | $0.000489 |

### `somewhere_fun_2_hours` — "take me somewhere fun for a 2-hour ride"
> No destination — should use planRoute with current location as start and let the orchestrator pick the destination.
**Expected tool**: `planRoute`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `geocode` | `{"query": "Santa Cruz, CA"}` |  | ✗ | 341 ms | $0.000515 |

### `take_hwy1_south` — "take Highway 1 south for about 2 hours"
> Rider names a specific road — should use sketch workflow, not planRoute.
**Expected tool**: `createRouteSketch`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `geocode` | `{"query": "Santa Cruz, CA"}` |  | ✗ | 465 ms | $0.000615 |

## Fixture: `search_agent`

### `abs_light` — "what does a blinking ABS light mean on my bike?"
> General motorcycle knowledge. No tool call expected.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `—` |  | A blinking ABS warning light means the system has detected a fault and has tempo | ✓ | 381 ms | $0.000292 |

### `gas_station_nearby` — "any gas stations around here?"
> Happy path POI lookup. Should use rider's current location as center.
**Expected tool**: `searchNearby`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `searchNearby` | `{"query": "gas station", "location": {"lat": 37.7749, "lng":` |  | ✓ | 297 ms | $0.000263 |

### `general_knowledge_tank` — "how many gallons does a typical sport touring motorcycle tank hold?"
> General knowledge — model should answer directly without calling tools. This is a TRAP — Haiku often over-calls webSearch here. llama3.1-8b may do the same.
**Expected tool**: (none — direct answer)

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `—` |  | A typical sport‑touring bike carries about 4.5 – 6 gallons (≈17–22 L) of fuel, d | ✓ | 230 ms | $0.000284 |

### `road_closures_hwy1` — "are there any road closures on Highway 1 right now?"
> Current/real-time info → webSearch.
**Expected tool**: `webSearch`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `webSearch` | `{"query": "current road closures Highway 1 California", "max` |  | ✓ | 1579 ms | $0.000237 |

### `viewpoints_near_carmel` — "any good viewpoints near Carmel?"
> Named location → geocode first, then searchNearby.
**Expected tool**: `geocode`

| Model | First tool | Args | Text | ✓ | Latency | Cost |
|---|---|---|---|---|---|---|
| `gpt-oss-120b` | `geocode` | `{"query": "Carmel, CA"}` |  | ✓ | 425 ms | $0.000271 |
