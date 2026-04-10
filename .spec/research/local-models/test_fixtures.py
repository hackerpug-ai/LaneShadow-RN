"""
Shared fixtures for Qwen3.5 vs Haiku ranking and route modification tests.
"""
import random
import math

random.seed(42)

# ─────────────────────────────────────────────────────────────────────────────
# Candidate ride pool (60 entries: 20 hand-crafted anchors + 40 fillers)
# ─────────────────────────────────────────────────────────────────────────────

ANCHOR_CANDIDATES = [
    # High-curvature twisties
    {"id": "us129-deals-gap",   "name": "Tail of the Dragon",        "state": "TN", "archetype": "twisties",   "length_mi": 11, "curvature": 0.95, "scenic": 0.70, "technical": 0.90, "traffic": 0.30, "remoteness": 0.55, "one_liner": "The most famous sport road in America."},
    {"id": "nc107-whitewater",  "name": "Whitewater Falls Road",     "state": "NC", "archetype": "twisties",   "length_mi": 18, "curvature": 0.88, "scenic": 0.82, "technical": 0.85, "traffic": 0.75, "remoteness": 0.65, "one_liner": "Tight switchbacks through Nantahala forest."},
    {"id": "us19e-roan",        "name": "Roan Mountain Ridgeline",   "state": "NC", "archetype": "mountain",   "length_mi": 22, "curvature": 0.72, "scenic": 0.93, "technical": 0.68, "traffic": 0.80, "remoteness": 0.72, "one_liner": "Grassy balds and panoramic Appalachian views."},
    {"id": "or242-mckenzie",    "name": "McKenzie Pass Highway",     "state": "OR", "archetype": "mountain",   "length_mi": 37, "curvature": 0.65, "scenic": 0.91, "technical": 0.60, "traffic": 0.72, "remoteness": 0.78, "one_liner": "Ancient lava fields and Cascade peak views."},
    {"id": "ca1-bigsur",        "name": "Big Sur Highway 1",         "state": "CA", "archetype": "coastal",    "length_mi": 90, "curvature": 0.78, "scenic": 0.97, "technical": 0.55, "traffic": 0.30, "remoteness": 0.55, "one_liner": "Pacific cliffs and wind-carved curves."},
    {"id": "brp-nc-southern",   "name": "Blue Ridge Parkway South",  "state": "NC", "archetype": "scenic_byway","length_mi":120, "curvature": 0.60, "scenic": 0.96, "technical": 0.45, "traffic": 0.70, "remoteness": 0.80, "one_liner": "469 miles of protected ridgeline highway."},
    {"id": "ut12-escalante",    "name": "Utah SR-12 Escalante",      "state": "UT", "archetype": "scenic_byway","length_mi": 124,"curvature": 0.55, "scenic": 0.95, "technical": 0.50, "traffic": 0.85, "remoteness": 0.88, "one_liner": "All-American Road through red rock canyon country."},
    {"id": "co550-million",     "name": "Million Dollar Highway",    "state": "CO", "archetype": "mountain",   "length_mi": 25, "curvature": 0.80, "scenic": 0.92, "technical": 0.78, "traffic": 0.65, "remoteness": 0.70, "one_liner": "Hairpin turns above 11,000 feet with no guardrails."},
    {"id": "wa20-cascade",      "name": "North Cascades Highway",    "state": "WA", "archetype": "mountain",   "length_mi": 85, "curvature": 0.62, "scenic": 0.94, "technical": 0.55, "traffic": 0.78, "remoteness": 0.82, "one_liner": "Summer-only alpine pass through glaciated peaks."},
    {"id": "nm4-jemez",         "name": "Jemez Mountain Trail",      "state": "NM", "archetype": "twisties",   "length_mi": 55, "curvature": 0.83, "scenic": 0.85, "technical": 0.75, "traffic": 0.82, "remoteness": 0.75, "one_liner": "Red rock canyons and volcanic calderas."},
    {"id": "tn56-falls",        "name": "Fall Creek Falls Road",     "state": "TN", "archetype": "twisties",   "length_mi": 20, "curvature": 0.79, "scenic": 0.78, "technical": 0.72, "traffic": 0.85, "remoteness": 0.68, "one_liner": "Cumberland Plateau curves with waterfall detours."},
    {"id": "id75-sawtooth",     "name": "Sawtooth Scenic Byway",     "state": "ID", "archetype": "scenic_byway","length_mi":115, "curvature": 0.48, "scenic": 0.93, "technical": 0.38, "traffic": 0.88, "remoteness": 0.90, "one_liner": "Stanley Basin high desert flanked by granite peaks."},
    {"id": "az89a-sedona",      "name": "Sedona Red Rock Loop",      "state": "AZ", "archetype": "scenic_byway","length_mi": 28, "curvature": 0.52, "scenic": 0.88, "technical": 0.42, "traffic": 0.45, "remoteness": 0.50, "one_liner": "Towering red sandstone and oak creek canyon."},
    {"id": "ca36-mad-river",    "name": "Mad River Road",            "state": "CA", "archetype": "twisties",   "length_mi": 66, "curvature": 0.90, "scenic": 0.75, "technical": 0.88, "traffic": 0.88, "remoteness": 0.80, "one_liner": "The loneliest, twistiest road in Northern California."},
    {"id": "mt2-glacier",       "name": "Going-to-the-Sun Road",     "state": "MT", "archetype": "mountain",   "length_mi": 50, "curvature": 0.70, "scenic": 0.98, "technical": 0.65, "traffic": 0.40, "remoteness": 0.85, "one_liner": "The most spectacular drive in North America."},
    # ── Adversarial anchors for failure-mode tests ──────────────────────────
    # Keyword trap: "Twisty" in name but low curvature score
    {"id": "twisty-meadow-trap","name": "Twisty Meadow Trail",       "state": "VT", "archetype": "scenic_byway","length_mi": 12, "curvature": 0.15, "scenic": 0.55, "technical": 0.12, "traffic": 0.90, "remoteness": 0.40, "one_liner": "Gentle farm road through Vermont meadows."},
    # Distractor: non-ride item
    {"id": "lunch-stop-distract","name": "Lunch Spot at Mile 12",    "state": "NC", "archetype": "scenic_byway","length_mi":  0, "curvature": 0.00, "scenic": 0.60, "technical": 0.00, "traffic": 0.95, "remoteness": 0.20, "one_liner": "Roadside diner with great views and cheap coffee."},
    # Score pairs for blindness test (A = high curvature, B = low)
    {"id": "score-pair-a1",     "name": "Identical Name Road A",     "state": "WA", "archetype": "twisties",   "length_mi": 30, "curvature": 0.92, "scenic": 0.65, "technical": 0.85, "traffic": 0.80, "remoteness": 0.60, "one_liner": "A beautiful road through dense forest."},
    {"id": "score-pair-b1",     "name": "Identical Name Road A",     "state": "WA", "archetype": "twisties",   "length_mi": 30, "curvature": 0.18, "scenic": 0.65, "technical": 0.15, "traffic": 0.80, "remoteness": 0.60, "one_liner": "A beautiful road through dense forest."},
    {"id": "score-pair-a2",     "name": "Mountain Ridge Drive B",    "state": "CO", "archetype": "mountain",   "length_mi": 45, "curvature": 0.88, "scenic": 0.85, "technical": 0.80, "traffic": 0.75, "remoteness": 0.70, "one_liner": "High alpine road with sweeping valley views."},
    {"id": "score-pair-b2",     "name": "Mountain Ridge Drive B",    "state": "CO", "archetype": "mountain",   "length_mi": 45, "curvature": 0.12, "scenic": 0.85, "technical": 0.10, "traffic": 0.75, "remoteness": 0.70, "one_liner": "High alpine road with sweeping valley views."},
]

def _make_filler(i):
    archetype = random.choice(["twisties","mountain","coastal","adventure","scenic_byway","desert"])
    state = random.choice(["TN","NC","CA","CO","UT","NM","OR","WA","VT","NH","ID","MT","AZ","NV","WY"])
    curvature = round(random.uniform(0.25, 0.85), 2)
    scenic = round(random.uniform(0.30, 0.90), 2)
    technical = round(random.uniform(0.20, 0.85), 2)
    traffic = round(random.uniform(0.35, 0.90), 2)
    remoteness = round(random.uniform(0.30, 0.90), 2)
    length_mi = random.randint(8, 110)
    return {
        "id": f"filler-{i:03d}",
        "name": f"Route {state}-{i:03d}",
        "state": state,
        "archetype": archetype,
        "length_mi": length_mi,
        "curvature": curvature,
        "scenic": scenic,
        "technical": technical,
        "traffic": traffic,
        "remoteness": remoteness,
        "one_liner": f"A {archetype.replace('_',' ')} road through {state}.",
    }

FILLER_CANDIDATES = [_make_filler(i) for i in range(40)]

FULL_POOL = ANCHOR_CANDIDATES + FILLER_CANDIDATES  # 60 total


def get_pool(n: int, include_anchors=True, seed=42) -> list:
    """Return a deterministic subset of N candidates."""
    random.seed(seed)
    if include_anchors:
        anchors = [c for c in ANCHOR_CANDIDATES
                   if c["id"] not in ("twisty-meadow-trap","lunch-stop-distract","score-pair-a1","score-pair-b1","score-pair-a2","score-pair-b2")]
        base = anchors[:min(15, n)]
        remainder = n - len(base)
        extra = random.sample(FILLER_CANDIDATES, min(remainder, len(FILLER_CANDIDATES)))
        pool = base + extra
    else:
        pool = random.sample(FULL_POOL, min(n, len(FULL_POOL)))
    random.seed(42)  # reset
    return pool


# ─────────────────────────────────────────────────────────────────────────────
# Ground truth scoring (deterministic, intent-specific)
# ─────────────────────────────────────────────────────────────────────────────

INTENTS = [
    {
        "id": "twisty-sport",
        "text": "twisty sport roads",
        "score_fn": lambda r: r["curvature"]*0.5 + (0.3 if r["archetype"]=="twisties" else 0) + r["technical"]*0.2,
    },
    {
        "id": "scenic-mountain",
        "text": "scenic mountain ride",
        "score_fn": lambda r: r["scenic"]*0.5 + (0.3 if r["archetype"]=="mountain" else 0) + r["remoteness"]*0.2,
    },
    {
        "id": "low-traffic",
        "text": "low traffic backroads away from crowds",
        "score_fn": lambda r: r["traffic"]*0.4 + r["remoteness"]*0.4 + (0.2 if r["archetype"]=="adventure" else 0),
    },
    {
        "id": "adventure-dirt",
        "text": "adventure and dirt roads",
        "score_fn": lambda r: (0.4 if r["archetype"]=="adventure" else 0) + r["technical"]*0.35 + r["remoteness"]*0.25,
    },
]


def ground_truth_top_k(pool: list, intent: dict, k: int = 5) -> list[str]:
    """Return the top-k IDs for a given intent using deterministic scoring."""
    scored = [(r["id"], intent["score_fn"](r)) for r in pool]
    scored.sort(key=lambda x: -x[1])
    return [rid for rid, _ in scored[:k]]


# ─────────────────────────────────────────────────────────────────────────────
# Route modification fixture: SF → Santa Cruz, 5 legs, alternates per leg
# ─────────────────────────────────────────────────────────────────────────────

SF_SANTA_CRUZ = {
    "route_id": "sf-santa-cruz",
    "from_city": "San Francisco",
    "to_city": "Santa Cruz",
    "total_distance_mi": 75,
    "primary_legs": [
        {
            "leg_id": "ssc-1a", "from": "San Francisco", "to": "Daly City",
            "road": "Highway 1", "highway": True, "toll": False,
            "distance_mi": 8, "curvature": 0.20, "scenic": 0.35, "traffic": 0.30,
        },
        {
            "leg_id": "ssc-2a", "from": "Daly City", "to": "Half Moon Bay",
            "road": "Highway 1", "highway": True, "toll": False,
            "distance_mi": 22, "curvature": 0.45, "scenic": 0.75, "traffic": 0.45,
        },
        {
            "leg_id": "ssc-3a", "from": "Half Moon Bay", "to": "Pescadero",
            "road": "Highway 1", "highway": True, "toll": False,
            "distance_mi": 18, "curvature": 0.55, "scenic": 0.85, "traffic": 0.60,
        },
        {
            "leg_id": "ssc-4a", "from": "Pescadero", "to": "Davenport",
            "road": "Highway 1", "highway": True, "toll": False,
            "distance_mi": 16, "curvature": 0.60, "scenic": 0.88, "traffic": 0.65,
        },
        {
            "leg_id": "ssc-5a", "from": "Davenport", "to": "Santa Cruz",
            "road": "Highway 1", "highway": True, "toll": False,
            "distance_mi": 11, "curvature": 0.42, "scenic": 0.72, "traffic": 0.50,
        },
    ],
    "alternates": {
        "ssc-1a": [
            {"leg_id": "ssc-1b", "from": "San Francisco", "to": "Daly City",
             "road": "I-280 S", "highway": True, "toll": False,
             "distance_mi": 10, "curvature": 0.10, "scenic": 0.25, "traffic": 0.35},
            {"leg_id": "ssc-1c", "from": "San Francisco", "to": "Daly City",
             "road": "Skyline Blvd", "highway": False, "toll": False,
             "distance_mi": 14, "curvature": 0.55, "scenic": 0.70, "traffic": 0.80},
        ],
        "ssc-2a": [
            {"leg_id": "ssc-2b", "from": "Daly City", "to": "Half Moon Bay",
             "road": "Skyline Blvd (I-35)", "highway": False, "toll": False,
             "distance_mi": 28, "curvature": 0.72, "scenic": 0.80, "traffic": 0.82},
            {"leg_id": "ssc-2c", "from": "Daly City", "to": "Half Moon Bay",
             "road": "I-280 to SR-92", "highway": True, "toll": False,
             "distance_mi": 20, "curvature": 0.15, "scenic": 0.40, "traffic": 0.40},
        ],
        "ssc-3a": [
            {"leg_id": "ssc-3b", "from": "Half Moon Bay", "to": "Pescadero",
             "road": "Tunitas Creek Rd", "highway": False, "toll": False,
             "distance_mi": 22, "curvature": 0.85, "scenic": 0.88, "traffic": 0.90},
            {"leg_id": "ssc-3c", "from": "Half Moon Bay", "to": "Pescadero",
             "road": "SR-84 East Loop", "highway": False, "toll": False,
             "distance_mi": 35, "curvature": 0.78, "scenic": 0.82, "traffic": 0.88},
        ],
        "ssc-4a": [
            {"leg_id": "ssc-4b", "from": "Pescadero", "to": "Davenport",
             "road": "Cloverdale Rd backroads", "highway": False, "toll": False,
             "distance_mi": 20, "curvature": 0.68, "scenic": 0.78, "traffic": 0.92},
            {"leg_id": "ssc-4c", "from": "Pescadero", "to": "Davenport",
             "road": "Stage Rd to Whitehouse Canyon", "highway": False, "toll": False,
             "distance_mi": 24, "curvature": 0.80, "scenic": 0.90, "traffic": 0.95},
        ],
        "ssc-5a": [
            {"leg_id": "ssc-5b", "from": "Davenport", "to": "Santa Cruz",
             "road": "Old Coast Rd", "highway": False, "toll": False,
             "distance_mi": 13, "curvature": 0.58, "scenic": 0.82, "traffic": 0.85},
            {"leg_id": "ssc-5c", "from": "Davenport", "to": "Santa Cruz",
             "road": "Empire Grade", "highway": False, "toll": False,
             "distance_mi": 18, "curvature": 0.75, "scenic": 0.70, "traffic": 0.90},
        ],
    },
}

MODIFICATION_SCENARIOS = [
    {
        "id": "M1-avoid-highway",
        "constraint": "Avoid Highway 1",
        "check": lambda legs, fixture: all(
            not _leg_by_id(lid, fixture)["highway"]
            for lid in legs
        ),
        "description": "All returned legs must have highway=False",
    },
    {
        "id": "M2-closed-leg",
        "constraint": "Leg ssc-3a (Half Moon Bay to Pescadero) is closed for construction. Find an alternate for that leg only.",
        "check": lambda legs, fixture: (
            "ssc-3a" not in legs and
            any(lid.startswith("ssc-3") for lid in legs)
        ),
        "description": "ssc-3a must not appear; a ssc-3x alternate must appear",
    },
    {
        "id": "M3-more-scenic",
        "constraint": "Make the route more scenic. Swap any legs where a more scenic alternate exists.",
        "check": lambda legs, fixture: _total_scenic(legs, fixture) >= _total_scenic([l["leg_id"] for l in fixture["primary_legs"]], fixture) - 0.01,
        "description": "Total scenic score must be >= original",
    },
    {
        "id": "M4-shorter",
        "constraint": "Make the route shorter. Choose alternates that reduce total distance where possible.",
        "check": lambda legs, fixture: _total_distance(legs, fixture) <= fixture["total_distance_mi"] + 5,
        "description": "Total distance must not exceed original by more than 5 miles",
    },
    {
        "id": "M5-multi-constraint",
        "constraint": "No Highway 1 AND no toll roads AND prefer the more scenic option at each leg.",
        "check": lambda legs, fixture: all(
            not _leg_by_id(lid, fixture)["highway"] and
            not _leg_by_id(lid, fixture)["toll"]
            for lid in legs
        ),
        "description": "No leg has highway=True or toll=True",
    },
    {
        "id": "M6-surgical-swap",
        "constraint": "Replace only legs ssc-2a and ssc-4a with alternates. Keep all other legs exactly as they are.",
        "check": lambda legs, fixture: (
            "ssc-1a" in legs and
            "ssc-2a" not in legs and
            "ssc-3a" in legs and
            "ssc-4a" not in legs and
            "ssc-5a" in legs
        ),
        "description": "ssc-1a, ssc-3a, ssc-5a must be unchanged; ssc-2a and ssc-4a must be replaced",
    },
    {
        "id": "M7-twistiest",
        "constraint": "Give me the twistiest possible version of this route. Use the highest-curvature alternate for every leg.",
        "check": lambda legs, fixture: _total_curvature(legs, fixture) >= _total_curvature([l["leg_id"] for l in fixture["primary_legs"]], fixture) - 0.05,
        "description": "Total curvature score must be >= original",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _all_legs(fixture: dict) -> dict:
    """Flat map of leg_id → leg for primary + all alternates."""
    out = {leg["leg_id"]: leg for leg in fixture["primary_legs"]}
    for alts in fixture["alternates"].values():
        for alt in alts:
            out[alt["leg_id"]] = alt
    return out


def _leg_by_id(leg_id: str, fixture: dict) -> dict:
    return _all_legs(fixture).get(leg_id, {"highway": False, "toll": False, "distance_mi": 0, "scenic": 0, "curvature": 0})


def _total_distance(leg_ids: list, fixture: dict) -> float:
    all_legs = _all_legs(fixture)
    return sum(all_legs.get(lid, {}).get("distance_mi", 0) for lid in leg_ids)


def _total_scenic(leg_ids: list, fixture: dict) -> float:
    all_legs = _all_legs(fixture)
    return sum(all_legs.get(lid, {}).get("scenic", 0) for lid in leg_ids)


def _total_curvature(leg_ids: list, fixture: dict) -> float:
    all_legs = _all_legs(fixture)
    return sum(all_legs.get(lid, {}).get("curvature", 0) for lid in leg_ids)


def format_candidate(c: dict) -> str:
    """Single-line representation for model prompts (~50 tokens)."""
    return (
        f"id={c['id']} archetype={c['archetype']} length={c['length_mi']}mi "
        f"curvature={c['curvature']} scenic={c['scenic']} technical={c['technical']} "
        f"traffic={c['traffic']} remoteness={c['remoteness']} "
        f'"{c["one_liner"]}"'
    )


def format_leg(leg: dict) -> str:
    return (
        f"{leg['leg_id']}: {leg['from']} → {leg['to']} via {leg['road']} "
        f"(highway={leg['highway']}, toll={leg['toll']}, {leg['distance_mi']}mi, "
        f"curvature={leg['curvature']}, scenic={leg['scenic']})"
    )


def format_alternates(fixture: dict) -> str:
    lines = []
    for primary_id, alts in fixture["alternates"].items():
        lines.append(f"Alternates for {primary_id}:")
        for alt in alts:
            lines.append(f"  {format_leg(alt)}")
    return "\n".join(lines)


if __name__ == "__main__":
    print(f"Total pool: {len(FULL_POOL)} candidates")
    print(f"Anchor candidates: {len(ANCHOR_CANDIDATES)}")
    print(f"Filler candidates: {len(FILLER_CANDIDATES)}")
    print(f"\nSF→Santa Cruz legs: {len(SF_SANTA_CRUZ['primary_legs'])}")
    print(f"Alternates: {sum(len(v) for v in SF_SANTA_CRUZ['alternates'].values())} total")
    print(f"\nModification scenarios: {len(MODIFICATION_SCENARIOS)}")
    for s in MODIFICATION_SCENARIOS:
        print(f"  {s['id']}: {s['description']}")
