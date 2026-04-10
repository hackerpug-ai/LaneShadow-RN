"""
Fixtures for route mutation intent → Mapbox API parameter extraction test.

Two test phases:

  Phase 1 — Classification
    Input:  natural-language intent + optional current route context
    Output: intent_type = "create" | "update" | "ambiguous"
    Goal:   distinguish "find me a ride to Santa Cruz" (CREATE) from
            "can we avoid Highway 1" (UPDATE)

  Phase 2 — Mutation parameter extraction
    Input:  UPDATE intent + current route context (waypoints, excludes, road)
    Output: list of mutation ops with key parameters
    Goal:   slot-fill the right op type + discriminating fields so
            deterministic code can construct the Mapbox API call diff

Unlike the prior route_modification test (SELECT from a pool of pre-scored
leg alternates), this is pure text → structure extraction — the same
pattern that Qwen3.5 0.8B demonstrated viability on with intent → SQL params.
"""

# ─────────────────────────────────────────────────────────────────────────────
# Route contexts used as prompt context for update scenarios
# ─────────────────────────────────────────────────────────────────────────────

ROUTE_A = {
    "name": "SF → Pescadero → Santa Cruz",
    "waypoints": [
        {"index": 0, "name": "San Francisco, CA", "role": "start"},
        {"index": 1, "name": "Pescadero, CA", "role": "waypoint"},
        {"index": 2, "name": "Santa Cruz, CA", "role": "end"},
    ],
    "primary_road": "Highway 1 (CA-1)",
    "excludes": [],
    "approx_miles": 85,
}

ROUTE_B = {
    "name": "SF → Mill Valley → Point Reyes → Bodega Bay",
    "waypoints": [
        {"index": 0, "name": "San Francisco, CA", "role": "start"},
        {"index": 1, "name": "Mill Valley, CA", "role": "waypoint"},
        {"index": 2, "name": "Point Reyes Station, CA", "role": "waypoint"},
        {"index": 3, "name": "Bodega Bay, CA", "role": "end"},
    ],
    "primary_road": "US-101 then CA-1",
    "excludes": [],
    "approx_miles": 100,
}


def format_route_context(route: dict) -> str:
    """Format a route dict into a human-readable prompt block."""
    lines = [f"Current route: {route['name']}"]
    lines.append("Waypoints:")
    for wp in route["waypoints"]:
        lines.append(f"  {wp['index']}: {wp['name']}  [{wp['role']}]")
    lines.append(f"Primary road: {route['primary_road']}")
    excl = ", ".join(route["excludes"]) if route["excludes"] else "none"
    lines.append(f"Current excludes: {excl}")
    lines.append(f"Approx distance: {route['approx_miles']} miles")
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Output schema
# ─────────────────────────────────────────────────────────────────────────────

MUTATION_SCHEMA = """
Output a JSON object with exactly these two keys:

  intent_type   "create" | "update" | "ambiguous"
  ops           array of mutation op objects (empty [] if intent_type == "create")

Each op object uses exactly these keys (all default to null):

  op                 "add_waypoint" | "remove_waypoint" | "exclude_feature"
                     | "avoid_road" | "trim_route" | "reorder_waypoints"
  waypoint_index     integer — index of waypoint to remove (remove_waypoint only)
  insert_before_index  integer — insert new waypoint before this index; null = append at end
  place_name         string — place to add (add_waypoint only)
  feature            "toll" | "motorway" | "ferry" | "unpaved" (exclude_feature only)
  road_hint          string — road name or description to avoid (avoid_road only)
  keep_through_index integer — drop all waypoints after this index (trim_route only)
  swap_indices       [integer, integer] — two waypoint indices to swap (reorder_waypoints only)
""".strip()

OP_TYPES = {
    "add_waypoint", "remove_waypoint", "exclude_feature",
    "avoid_road", "trim_route", "reorder_waypoints",
}
FEATURES = {"toll", "motorway", "ferry", "unpaved"}
INTENT_TYPES = {"create", "update", "ambiguous"}


# ─────────────────────────────────────────────────────────────────────────────
# Phase 1 — Classification scenarios
# ─────────────────────────────────────────────────────────────────────────────
#
# Each scenario:
#   id:                  short name
#   intent:              raw rider utterance
#   route_context:       None (no active route) | ROUTE_A | ROUTE_B
#   expected_type:       "create" | "update" | "ambiguous"
#   difficulty:          easy | medium | hard
#   note:                human explanation of why

CLASSIFICATION_SCENARIOS = [
    # ── Clear CREATE — no active route, starting from scratch ────────────────
    {
        "id": "C1-destination",
        "intent": "Find me a ride to Santa Cruz",
        "route_context": None,
        "expected_type": "create",
        "difficulty": "easy",
        "note": "No current route; rider is requesting a new one to a destination.",
    },
    {
        "id": "C2-archetype",
        "intent": "Show me something twisty near Marin",
        "route_context": None,
        "expected_type": "create",
        "difficulty": "easy",
        "note": "Discovery intent with no current route.",
    },
    {
        "id": "C3-vague-create",
        "intent": "I want to explore the Big Sur coast",
        "route_context": None,
        "expected_type": "create",
        "difficulty": "easy",
        "note": "Vague but clearly a new route request.",
    },
    {
        "id": "C4-explicit-plan",
        "intent": "Plan a route from SF to Lake Tahoe",
        "route_context": None,
        "expected_type": "create",
        "difficulty": "easy",
        "note": "Explicit plan request with A→B structure.",
    },
    {
        "id": "C5-discovery",
        "intent": "What's a good mountain road near me?",
        "route_context": None,
        "expected_type": "create",
        "difficulty": "easy",
        "note": "Discovery question, no route active.",
    },
    {
        "id": "C6-day-ride",
        "intent": "Take me somewhere scenic for the day",
        "route_context": None,
        "expected_type": "create",
        "difficulty": "easy",
        "note": "Open-ended day ride request.",
    },

    # ── Clear UPDATE — active route in context, asking for a change ──────────
    {
        "id": "U1-avoid-road",
        "intent": "Can we avoid Highway 1?",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "easy",
        "note": "Active route uses HWY 1. Rider wants to change the road used.",
    },
    {
        "id": "U2-remove-stop",
        "intent": "Skip Pescadero, go straight to Santa Cruz",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "easy",
        "note": "Explicitly naming a waypoint to remove.",
    },
    {
        "id": "U3-add-stop",
        "intent": "Add a stop at Pigeon Point Lighthouse",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "easy",
        "note": "Adding a specific new waypoint to an active route.",
    },
    {
        "id": "U4-exclude",
        "intent": "No toll roads please",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "easy",
        "note": "Feature exclusion applied to active route.",
    },
    {
        "id": "U5-trim",
        "intent": "Let's cut the trip short, end at Pescadero",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "easy",
        "note": "Explicit route truncation.",
    },
    {
        "id": "U6-extend",
        "intent": "Can we extend this to Monterey after Santa Cruz?",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "medium",
        "note": "Appending a new destination to active route.",
    },
    {
        "id": "U7-implicit-add",
        "intent": "Can we go through Carmel on the way?",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "medium",
        "note": "Implicit add_waypoint via 'on the way'.",
    },
    {
        "id": "U8-tired-trim",
        "intent": "I'm tired, let's head straight home from here",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "medium",
        "note": "Fatigue → trim route context signal.",
    },

    # ── Ambiguous — could be either, or truly unclear ────────────────────────
    {
        "id": "A1-different-route",
        "intent": "Give me a different route",
        "route_context": ROUTE_A,
        "expected_type": "ambiguous",
        "difficulty": "hard",
        "note": "Reroute the same A→B (update) or find a new ride entirely (create)?",
    },
    {
        "id": "A2-more-scenic",
        "intent": "Make it more scenic",
        "route_context": ROUTE_A,
        "expected_type": "ambiguous",
        "difficulty": "hard",
        "note": "Could be avoid_road + add_waypoint (update) or new route discovery (create).",
    },
    {
        "id": "A3-shorter-no-context",
        "intent": "Something shorter",
        "route_context": None,
        "expected_type": "create",
        "difficulty": "medium",
        "note": "No active route — this is a filter for a new route (create with max_length_mi).",
    },
    {
        "id": "A4-coffee-stop",
        "intent": "Can we stop for coffee somewhere?",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "medium",
        "note": "Generic add_waypoint with no specific place — clearly update on active route.",
    },
    {
        "id": "A5-mountain-instead",
        "intent": "Let's try the mountain road instead of the coast",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "hard",
        "note": "Prefer update: 'instead of' implies changing current route.",
    },
    {
        "id": "A6-try-something-else",
        "intent": "I want to try something else",
        "route_context": ROUTE_A,
        "expected_type": "ambiguous",
        "difficulty": "hard",
        "note": "Too vague to determine create vs update even with route context.",
    },
    {
        "id": "A7-reverse",
        "intent": "Let's do this backwards",
        "route_context": ROUTE_A,
        "expected_type": "update",
        "difficulty": "medium",
        "note": "Active route in context + 'backwards' → reorder_waypoints.",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Phase 2 — Mutation extraction scenarios
# ─────────────────────────────────────────────────────────────────────────────
#
# Each scenario:
#   id:           short name
#   intent:       raw rider utterance (all are UPDATE intents)
#   route:        ROUTE_A or ROUTE_B (always provided)
#   expected_ops: list of op dicts to score against (the "right answer")
#   required_ops: subset of expected_ops that MUST appear (keyed by op type)
#   forbidden_ops: op types that should NOT appear (wrong call)
#   difficulty:   easy | medium | hard
#
# Scoring: for each expected op, check model output contains an op of the
# same type with matching discriminating fields.

MUTATION_SCENARIOS = [
    # ── Easy: single op, explicit ─────────────────────────────────────────────
    {
        "id": "M1-avoid-hwy1",
        "intent": "Can we avoid Highway 1?",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "avoid_road", "road_hint": "Highway 1"},
        ],
        "required_ops": ["avoid_road"],
        "forbidden_ops": ["remove_waypoint"],
        "difficulty": "easy",
    },
    {
        "id": "M2-remove-pescadero",
        "intent": "Skip Pescadero, go straight to Santa Cruz",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "remove_waypoint", "waypoint_index": 1},
        ],
        "required_ops": ["remove_waypoint"],
        "forbidden_ops": ["add_waypoint", "trim_route"],
        "difficulty": "easy",
    },
    {
        "id": "M3-add-pigeon-point",
        "intent": "Add a stop at Pigeon Point Lighthouse before Santa Cruz",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "add_waypoint", "place_name": "Pigeon Point", "insert_before_index": 2},
        ],
        "required_ops": ["add_waypoint"],
        "forbidden_ops": ["remove_waypoint", "trim_route"],
        "difficulty": "easy",
    },
    {
        "id": "M4-no-tolls",
        "intent": "No toll roads please",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "exclude_feature", "feature": "toll"},
        ],
        "required_ops": ["exclude_feature"],
        "forbidden_ops": ["avoid_road", "remove_waypoint"],
        "difficulty": "easy",
    },
    {
        "id": "M5-trim-at-pescadero",
        "intent": "Let's end the ride at Pescadero, skip Santa Cruz",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "trim_route", "keep_through_index": 1},
        ],
        "required_ops": ["trim_route"],
        "forbidden_ops": ["remove_waypoint"],
        "difficulty": "easy",
    },
    {
        "id": "M6-extend-to-monterey",
        "intent": "Can we extend this to Monterey after Santa Cruz?",
        "route": ROUTE_A,
        "expected_ops": [
            # insert_before_index null means append at end
            {"op": "add_waypoint", "place_name": "Monterey", "insert_before_index": None},
        ],
        "required_ops": ["add_waypoint"],
        "forbidden_ops": ["trim_route", "remove_waypoint"],
        "difficulty": "easy",
    },
    {
        "id": "M7-avoid-ferry",
        "intent": "Avoid any ferry crossings",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "exclude_feature", "feature": "ferry"},
        ],
        "required_ops": ["exclude_feature"],
        "forbidden_ops": ["avoid_road"],
        "difficulty": "easy",
    },

    # ── Medium: inference required ────────────────────────────────────────────
    {
        "id": "M8-add-hmb",
        "intent": "Go through Half Moon Bay on the way",
        "route": ROUTE_A,
        "expected_ops": [
            # HMB sits between SF and Pescadero on HWY 1 → insert before index 1
            {"op": "add_waypoint", "place_name": "Half Moon Bay", "insert_before_index": 1},
        ],
        "required_ops": ["add_waypoint"],
        "forbidden_ops": ["remove_waypoint", "trim_route"],
        "difficulty": "medium",
    },
    {
        "id": "M9-inland-route",
        "intent": "Take the inland route, avoid the coastal highway",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "avoid_road", "road_hint": "Highway 1"},
        ],
        "required_ops": ["avoid_road"],
        "forbidden_ops": ["exclude_feature"],
        "difficulty": "medium",
    },
    {
        "id": "M10-coffee-break",
        "intent": "Add a stop somewhere in the middle for a coffee break",
        "route": ROUTE_A,
        "expected_ops": [
            # Generic midpoint add — place_name may be null, index ~1
            {"op": "add_waypoint", "insert_before_index": 1},
        ],
        "required_ops": ["add_waypoint"],
        "forbidden_ops": ["remove_waypoint", "trim_route"],
        "difficulty": "medium",
    },
    {
        "id": "M11-straight-shot",
        "intent": "Skip all the intermediate stops, take the straight shot",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "remove_waypoint", "waypoint_index": 1},
        ],
        "required_ops": ["remove_waypoint"],
        "forbidden_ops": ["trim_route"],
        "difficulty": "medium",
    },
    {
        "id": "M12-no-highways",
        "intent": "Take back roads only, avoid major highways",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "exclude_feature", "feature": "motorway"},
        ],
        "required_ops": ["exclude_feature"],
        "forbidden_ops": [],
        "difficulty": "medium",
    },
    {
        "id": "M13-skip-mill-valley",
        "intent": "Skip Mill Valley, go straight to Point Reyes",
        "route": ROUTE_B,
        "expected_ops": [
            {"op": "remove_waypoint", "waypoint_index": 1},
        ],
        "required_ops": ["remove_waypoint"],
        "forbidden_ops": ["add_waypoint", "trim_route"],
        "difficulty": "medium",
    },
    {
        "id": "M14-add-stinson",
        "intent": "Can we ride through Stinson Beach after Mill Valley?",
        "route": ROUTE_B,
        "expected_ops": [
            {"op": "add_waypoint", "place_name": "Stinson Beach", "insert_before_index": 2},
        ],
        "required_ops": ["add_waypoint"],
        "forbidden_ops": ["remove_waypoint"],
        "difficulty": "medium",
    },

    # ── Hard: multi-op or significant inference ───────────────────────────────
    {
        "id": "M15-two-stops",
        "intent": "Go through Half Moon Bay AND Davenport",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "add_waypoint", "place_name": "Half Moon Bay", "insert_before_index": 1},
            {"op": "add_waypoint", "place_name": "Davenport", "insert_before_index": 2},
        ],
        "required_ops": ["add_waypoint"],  # at least one add_waypoint
        "forbidden_ops": ["remove_waypoint"],
        "difficulty": "hard",
    },
    {
        "id": "M16-multi-exclude",
        "intent": "No tolls and avoid the coastal highway",
        "route": ROUTE_A,
        "expected_ops": [
            {"op": "exclude_feature", "feature": "toll"},
            {"op": "avoid_road", "road_hint": "Highway 1"},
        ],
        "required_ops": ["exclude_feature", "avoid_road"],
        "forbidden_ops": ["remove_waypoint"],
        "difficulty": "hard",
    },
    {
        "id": "M17-swap-stops",
        "intent": "Go to Bodega Bay first, then loop back to Point Reyes",
        "route": ROUTE_B,
        "expected_ops": [
            {"op": "reorder_waypoints", "swap_indices": [2, 3]},
        ],
        "required_ops": ["reorder_waypoints"],
        "forbidden_ops": ["trim_route"],
        "difficulty": "hard",
    },
    {
        "id": "M18-remove-all-middle",
        "intent": "Remove all the stops, go straight from SF to Bodega Bay",
        "route": ROUTE_B,
        "expected_ops": [
            {"op": "remove_waypoint", "waypoint_index": 1},
            {"op": "remove_waypoint", "waypoint_index": 2},
        ],
        "required_ops": ["remove_waypoint"],
        "forbidden_ops": ["trim_route"],
        "difficulty": "hard",
    },
    {
        "id": "M19-trim-at-point-reyes",
        "intent": "Let's end the ride at Point Reyes, skip Bodega Bay",
        "route": ROUTE_B,
        "expected_ops": [
            {"op": "trim_route", "keep_through_index": 2},
        ],
        "required_ops": ["trim_route"],
        "forbidden_ops": ["remove_waypoint"],
        "difficulty": "hard",
    },
    {
        "id": "M20-extend-petaluma",
        "intent": "After Bodega Bay, add a stop in Petaluma before heading home",
        "route": ROUTE_B,
        "expected_ops": [
            {"op": "add_waypoint", "place_name": "Petaluma", "insert_before_index": None},
        ],
        "required_ops": ["add_waypoint"],
        "forbidden_ops": ["remove_waypoint", "trim_route"],
        "difficulty": "hard",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Scoring helpers
# ─────────────────────────────────────────────────────────────────────────────

def _op_matches_expected(model_op: dict, expected_op: dict) -> bool:
    """
    Check whether a model-output op matches an expected op.

    Matching rules:
    - op type must match exactly.
    - For each non-null discriminating field in expected_op:
        add_waypoint:     place_name is a case-insensitive substring match
                          insert_before_index matches (None == None or int)
        remove_waypoint:  waypoint_index matches exactly
        exclude_feature:  feature matches exactly
        avoid_road:       road_hint is a case-insensitive substring match
        trim_route:       keep_through_index matches exactly
        reorder_waypoints: swap_indices match as sets
    """
    if model_op.get("op") != expected_op.get("op"):
        return False

    op = expected_op["op"]

    if op == "add_waypoint":
        exp_name = expected_op.get("place_name")
        if exp_name is not None:
            mod_name = model_op.get("place_name") or ""
            if exp_name.lower() not in mod_name.lower():
                return False
        exp_idx = expected_op.get("insert_before_index")
        if exp_idx is not None:
            if model_op.get("insert_before_index") != exp_idx:
                return False

    elif op == "remove_waypoint":
        exp_idx = expected_op.get("waypoint_index")
        if exp_idx is not None:
            if model_op.get("waypoint_index") != exp_idx:
                return False

    elif op == "exclude_feature":
        exp_feat = expected_op.get("feature")
        if exp_feat is not None:
            if model_op.get("feature") != exp_feat:
                return False

    elif op == "avoid_road":
        exp_hint = expected_op.get("road_hint")
        if exp_hint is not None:
            mod_hint = model_op.get("road_hint") or ""
            if exp_hint.lower() not in mod_hint.lower():
                return False

    elif op == "trim_route":
        exp_idx = expected_op.get("keep_through_index")
        if exp_idx is not None:
            if model_op.get("keep_through_index") != exp_idx:
                return False

    elif op == "reorder_waypoints":
        exp_swap = expected_op.get("swap_indices")
        if exp_swap is not None:
            mod_swap = model_op.get("swap_indices")
            if not mod_swap or set(map(int, exp_swap)) != set(map(int, mod_swap)):
                return False

    return True


def score_classification(predicted_type: str | None, scenario: dict) -> dict:
    """Score a single classification scenario."""
    expected = scenario["expected_type"]
    correct = predicted_type == expected
    return {
        "expected": expected,
        "predicted": predicted_type,
        "correct": correct,
    }


def score_mutation(model_ops: list[dict] | None, scenario: dict) -> dict:
    """Score a single mutation extraction scenario against expected ops."""
    expected_ops = scenario["expected_ops"]
    required_op_types = set(scenario["required_ops"])
    forbidden_op_types = set(scenario["forbidden_ops"])

    if model_ops is None:
        return {
            "precision": 0.0, "recall": 0.0, "f1": 0.0,
            "required_hit_rate": 0.0,
            "forbidden_violations": 0,
            "ops_count": 0,
        }

    # Forbidden violations: any op type that should not appear
    fbd = sum(1 for op in model_ops if op.get("op") in forbidden_op_types)

    # For each expected op, find the best-matching model op
    matched_expected = 0
    for exp_op in expected_ops:
        for mod_op in model_ops:
            if _op_matches_expected(mod_op, exp_op):
                matched_expected += 1
                break

    # Required hit rate: required op types that appear in model output
    model_op_types = {op.get("op") for op in model_ops}
    required_hit = len(required_op_types & model_op_types) / len(required_op_types) if required_op_types else 1.0

    tp = matched_expected
    precision = tp / len(model_ops) if model_ops else 0.0
    recall = tp / len(expected_ops) if expected_ops else 1.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

    return {
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(f1, 3),
        "required_hit_rate": round(required_hit, 3),
        "forbidden_violations": fbd,
        "ops_count": len(model_ops),
    }


if __name__ == "__main__":
    print(f"Classification scenarios: {len(CLASSIFICATION_SCENARIOS)}")
    print(f"  create:    {sum(1 for s in CLASSIFICATION_SCENARIOS if s['expected_type'] == 'create')}")
    print(f"  update:    {sum(1 for s in CLASSIFICATION_SCENARIOS if s['expected_type'] == 'update')}")
    print(f"  ambiguous: {sum(1 for s in CLASSIFICATION_SCENARIOS if s['expected_type'] == 'ambiguous')}")
    print()
    print(f"Mutation scenarios: {len(MUTATION_SCENARIOS)}")
    for diff in ["easy", "medium", "hard"]:
        n = sum(1 for s in MUTATION_SCENARIOS if s["difficulty"] == diff)
        print(f"  {diff}: {n}")
    print()
    # Smoke-test scoring helpers
    good_op = {"op": "avoid_road", "road_hint": "Highway 1 (CA-1)"}
    exp_op  = {"op": "avoid_road", "road_hint": "Highway 1"}
    assert _op_matches_expected(good_op, exp_op), "substring match should pass"
    bad_op  = {"op": "exclude_feature", "feature": "toll"}
    assert not _op_matches_expected(bad_op, exp_op), "wrong op type should fail"
    print("✅ Scoring helpers OK")
    print()
    print("Sample route context A:")
    print(format_route_context(ROUTE_A))
