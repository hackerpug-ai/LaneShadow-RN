"""
Fixtures for intent → SQL query parameter extraction test.

Contains:
  - 20 curated route records with lat/lng centroids (lean tier schema)
  - User anchor location + default search radius
  - 15 test scenarios with intent text + expected result IDs
  - Schema + helper to build an in-memory SQLite DB
"""
import sqlite3

# ─────────────────────────────────────────────────────────────────────────────
# User anchor (product assumes every search is anchored to the rider's location)
# ─────────────────────────────────────────────────────────────────────────────

USER_LOCATION = {
    "lat": 37.77,
    "lng": -122.42,
    "state": "CA",
    "city": "San Francisco",
}
DEFAULT_RADIUS_MI = 900  # generous default so most archetypes have candidates

# ─────────────────────────────────────────────────────────────────────────────
# Schema
# ─────────────────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE curated_routes (
    route_id          TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    state             TEXT NOT NULL,
    primary_archetype TEXT NOT NULL,   -- twisties|mountain|coastal|adventure|scenic_byway|desert
    length_mi         REAL NOT NULL,
    curvature_score   REAL NOT NULL,   -- 0.0-1.0
    scenic_score      REAL NOT NULL,
    technical_score   REAL NOT NULL,
    traffic_score     REAL NOT NULL,   -- INVERTED: high = low traffic (good)
    remoteness_score  REAL NOT NULL,
    season            TEXT NOT NULL,   -- year_round|apr_nov|may_sep|spring_fall
    centroid_lat      REAL NOT NULL,
    centroid_lng      REAL NOT NULL
);
"""

# ─────────────────────────────────────────────────────────────────────────────
# 20 curated routes (with approximate centroid coordinates)
# ─────────────────────────────────────────────────────────────────────────────

ROUTES = [
    # route_id, name, state, archetype, length, curv, scenic, tech, traffic, remote, season, lat, lng
    ("us129-deals-gap",    "Tail of the Dragon",       "TN", "twisties",    11,  0.95, 0.70, 0.90, 0.30, 0.55, "year_round", 35.46,  -83.92),
    ("ca1-bigsur",         "Big Sur Highway 1",        "CA", "coastal",     90,  0.78, 0.97, 0.55, 0.30, 0.55, "year_round", 36.22, -121.78),
    ("brp-south",          "Blue Ridge Parkway South", "NC", "scenic_byway",120, 0.60, 0.96, 0.45, 0.70, 0.80, "apr_nov",    35.60,  -82.60),
    ("co550-million",      "Million Dollar Highway",   "CO", "mountain",    25,  0.80, 0.92, 0.78, 0.65, 0.70, "may_sep",    37.90, -107.70),
    ("ut12-escalante",     "Utah SR-12 Escalante",     "UT", "scenic_byway",124, 0.55, 0.95, 0.50, 0.85, 0.88, "year_round", 37.80, -111.60),
    ("mt2-glacier",        "Going-to-the-Sun Road",    "MT", "mountain",    50,  0.70, 0.98, 0.65, 0.40, 0.85, "may_sep",    48.70, -113.70),
    ("ca36-mad-river",     "Mad River Road",           "CA", "twisties",    66,  0.90, 0.75, 0.88, 0.88, 0.80, "year_round", 40.40, -123.40),
    ("ut-bdr-segment",     "Utah BDR Segment",         "UT", "adventure",   180, 0.45, 0.88, 0.90, 0.95, 0.95, "apr_nov",    39.00, -110.00),
    ("nv-extraterrestrial","Extraterrestrial Highway", "NV", "desert",      98,  0.15, 0.70, 0.20, 0.95, 0.98, "year_round", 37.50, -115.70),
    ("or242-mckenzie",     "McKenzie Pass Highway",    "OR", "mountain",    37,  0.65, 0.91, 0.60, 0.72, 0.78, "may_sep",    44.25, -121.88),
    ("az89a-sedona",       "Sedona Red Rock Loop",     "AZ", "scenic_byway",28,  0.52, 0.88, 0.42, 0.45, 0.50, "year_round", 34.87, -111.76),
    ("nc107-whitewater",   "Whitewater Falls Road",    "NC", "twisties",    18,  0.88, 0.82, 0.85, 0.75, 0.65, "year_round", 35.02,  -83.00),
    ("wa101-olympic",      "Olympic Peninsula Loop",   "WA", "coastal",     330, 0.55, 0.95, 0.40, 0.75, 0.70, "year_round", 47.80, -123.90),
    ("nm4-jemez",          "Jemez Mountain Trail",     "NM", "twisties",    55,  0.83, 0.85, 0.75, 0.82, 0.75, "apr_nov",    35.77, -106.55),
    ("vt100-mad-river",    "Vermont Route 100",        "VT", "scenic_byway",42,  0.55, 0.85, 0.40, 0.75, 0.65, "may_sep",    44.20,  -72.85),
    ("az-apache-trail",    "Apache Trail",             "AZ", "adventure",   40,  0.70, 0.85, 0.85, 0.78, 0.75, "year_round", 33.55, -111.25),
    ("ca-mulholland",      "Mulholland Highway",       "CA", "twisties",    15,  0.92, 0.65, 0.80, 0.35, 0.20, "year_round", 34.12, -118.85),
    ("id75-sawtooth",      "Sawtooth Scenic Byway",    "ID", "scenic_byway",115, 0.48, 0.93, 0.38, 0.88, 0.90, "may_sep",    43.95, -114.92),
    ("tx170-river-road",   "FM 170 River Road",        "TX", "desert",      53,  0.75, 0.85, 0.55, 0.92, 0.92, "year_round", 29.38, -103.30),
    ("co82-independence",  "Independence Pass",        "CO", "mountain",    32,  0.88, 0.92, 0.80, 0.60, 0.70, "may_sep",    39.10, -106.56),
]


def in_radius(route_tuple, user_loc=USER_LOCATION, radius_mi=DEFAULT_RADIUS_MI) -> bool:
    """Rough bounding-box distance check — matches params_to_sql logic."""
    lat, lng = route_tuple[11], route_tuple[12]
    lat_delta = radius_mi / 69.0
    lng_delta = radius_mi / 55.0
    return (
        abs(lat - user_loc["lat"]) <= lat_delta
        and abs(lng - user_loc["lng"]) <= lng_delta
    )


def routes_in_default_radius() -> list[str]:
    """IDs of routes inside the default radius of USER_LOCATION."""
    return [r[0] for r in ROUTES if in_radius(r)]


def build_db() -> sqlite3.Connection:
    """Create an in-memory SQLite DB, seeded with 20 test routes."""
    conn = sqlite3.connect(":memory:")
    conn.executescript(SCHEMA)
    conn.executemany(
        "INSERT INTO curated_routes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ROUTES,
    )
    conn.commit()
    return conn


# ─────────────────────────────────────────────────────────────────────────────
# Test scenarios: intent → expected result IDs
# ─────────────────────────────────────────────────────────────────────────────
#
# Each scenario:
#   id:            short name
#   intent:        natural-language input to Qwen/Haiku
#   expected:      set of route_ids that should appear in results (target)
#   required:      subset of expected that MUST appear (critical hits)
#   forbidden:     routes that should NEVER appear (obvious wrong answers)
#   difficulty:    easy | medium | hard | subjective
#
# Scoring: F1 score of returned vs expected. Required routes weighted higher.

#
# Anchor: San Francisco, CA. Default bounding box ≈ 900mi (rectangular,
# per params_to_sql). In-radius routes (15 of 20):
#   ca1-bigsur, ca36-mad-river, ca-mulholland, or242-mckenzie, nv-extraterrestrial,
#   wa101-olympic, ut12-escalante, id75-sawtooth, az89a-sedona, mt2-glacier,
#   az-apache-trail, ut-bdr-segment, co550-million, co82-independence, nm4-jemez
# Out of radius (5): us129-deals-gap, brp-south, nc107-whitewater, tx170-river-road, vt100-mad-river
#

SCENARIOS = [
    # ── Simple archetype / state filters (EASY) ──────────────────────────────
    {
        "id": "S1-coastal",
        "intent": "I feel like a beachy coastal ride",
        "expected": ["ca1-bigsur", "wa101-olympic"],
        "required": ["ca1-bigsur"],
        "forbidden": ["nv-extraterrestrial", "co550-million"],
        "difficulty": "easy",
    },
    {
        "id": "S2-colorado",
        "intent": "Show me something to ride in Colorado",
        "expected": ["co550-million", "co82-independence"],
        "required": ["co550-million", "co82-independence"],
        "forbidden": ["ca1-bigsur", "nv-extraterrestrial"],
        "difficulty": "easy",
    },
    {
        "id": "S3-desert",
        "intent": "I want a desert ride",
        "expected": ["nv-extraterrestrial"],
        "required": ["nv-extraterrestrial"],
        "forbidden": ["ca1-bigsur", "mt2-glacier"],
        "difficulty": "easy",
    },
    {
        "id": "S4-scenic-byway",
        "intent": "I want a classic scenic byway",
        # In-radius scenic_byway: ut12, az89a, id75
        "expected": ["ut12-escalante", "az89a-sedona", "id75-sawtooth"],
        "required": ["ut12-escalante"],
        "forbidden": ["us129-deals-gap", "ca36-mad-river", "nv-extraterrestrial"],
        "difficulty": "easy",
    },
    {
        "id": "S5-short",
        "intent": "Something short, under 20 miles",
        # In-radius routes ≤20mi: ca-mulholland (15). us129/nc107 out of radius.
        "expected": ["ca-mulholland"],
        "required": ["ca-mulholland"],
        "forbidden": ["wa101-olympic", "ut-bdr-segment", "ut12-escalante"],
        "difficulty": "easy",
    },

    # ── Combined filters (MEDIUM) ────────────────────────────────────────────
    {
        "id": "S6-utah-adventure",
        "intent": "Adventure riding in Utah",
        "expected": ["ut-bdr-segment"],
        "required": ["ut-bdr-segment"],
        "forbidden": ["ca1-bigsur", "az-apache-trail"],
        "difficulty": "medium",
    },
    {
        "id": "S7-mountain-long",
        "intent": "A mountain ride at least 40 miles long",
        # In-radius mountain ≥40mi: mt2-glacier (50). or242 is 37mi, co550 is 25mi, co82 is 32mi.
        "expected": ["mt2-glacier"],
        "required": ["mt2-glacier"],
        "forbidden": ["us129-deals-gap", "or242-mckenzie", "co550-million"],
        "difficulty": "medium",
    },
    {
        "id": "S8-yearround-twisty",
        "intent": "Twisty roads I can ride any time of year",
        # In-radius twisties with year_round season: ca36-mad-river, ca-mulholland
        # (nm4-jemez is apr_nov)
        "expected": ["ca36-mad-river", "ca-mulholland"],
        "required": ["ca-mulholland"],
        "forbidden": ["nm4-jemez"],
        "difficulty": "medium",
    },

    # ── Sort-by semantics (HARD) ─────────────────────────────────────────────
    {
        "id": "S9-twistiest",
        "intent": "Give me the twistiest roads possible",
        # In-radius top curvature:
        #   ca-mulholland (0.92), ca36-mad-river (0.90), co82-independence (0.88),
        #   nm4-jemez (0.83), co550-million (0.80)
        "expected": ["ca-mulholland", "ca36-mad-river", "co82-independence", "nm4-jemez", "co550-million"],
        "required": ["ca-mulholland", "ca36-mad-river"],
        "forbidden": ["nv-extraterrestrial"],
        "difficulty": "hard",
    },
    {
        "id": "S10-most-scenic",
        "intent": "The most scenic rides you have",
        # In-radius top scenic:
        #   mt2-glacier (0.98), ca1-bigsur (0.97), wa101-olympic (0.95),
        #   ut12-escalante (0.95), id75-sawtooth (0.93), co550-million (0.92)
        "expected": ["mt2-glacier", "ca1-bigsur", "wa101-olympic", "ut12-escalante", "id75-sawtooth"],
        "required": ["ca1-bigsur"],
        "forbidden": ["ca-mulholland", "nv-extraterrestrial"],
        "difficulty": "hard",
    },
    {
        "id": "S11-remote",
        "intent": "Something remote, away from crowds and cities",
        # In-radius top remoteness:
        #   nv (0.98), ut-bdr (0.95), id75 (0.90), ut12 (0.88), mt2 (0.85)
        "expected": ["nv-extraterrestrial", "ut-bdr-segment", "id75-sawtooth", "ut12-escalante"],
        "required": ["nv-extraterrestrial", "ut-bdr-segment"],
        "forbidden": ["ca-mulholland"],
        "difficulty": "hard",
    },

    # ── Subjective / interpretive (SUBJECTIVE) ───────────────────────────────
    {
        "id": "S12-epic-long",
        "intent": "An epic long distance trip",
        # In-radius longest: wa101 (330), ut-bdr (180), ut12 (124), id75 (115), ca1-bigsur (90), nv (98)
        "expected": ["wa101-olympic", "ut-bdr-segment", "ut12-escalante", "id75-sawtooth"],
        "required": ["wa101-olympic"],
        "forbidden": ["ca-mulholland", "co550-million", "az89a-sedona"],
        "difficulty": "subjective",
    },
    {
        "id": "S13-challenging",
        "intent": "Something challenging and technical for experienced riders",
        # In-radius top technical:
        #   ut-bdr (0.90), ca36 (0.88), az-apache (0.85), ca-mulholland (0.80),
        #   co82 (0.80), co550 (0.78), nm4 (0.75)
        "expected": ["ut-bdr-segment", "ca36-mad-river", "az-apache-trail", "ca-mulholland", "co82-independence"],
        "required": ["ut-bdr-segment"],
        "forbidden": ["nv-extraterrestrial", "az89a-sedona"],
        "difficulty": "subjective",
    },
    {
        "id": "S14-gentle",
        "intent": "A gentle relaxing ride for beginners, nothing too technical",
        # In-radius low technical (≤0.5):
        #   nv (0.20), id75 (0.38), wa101 (0.40), az89a (0.42), ut-bdr NO (0.90), ut12 (0.50)
        "expected": ["az89a-sedona", "wa101-olympic", "id75-sawtooth", "nv-extraterrestrial", "ut12-escalante"],
        "required": ["az89a-sedona"],
        "forbidden": ["us129-deals-gap", "ca36-mad-river", "ut-bdr-segment"],
        "difficulty": "subjective",
    },
    {
        "id": "S15-twisty-mountain",
        "intent": "Twisty mountain roads",
        # In-radius mountain by curvature: co82 (0.88), co550 (0.80), mt2 (0.70), or242 (0.65)
        "expected": ["co82-independence", "co550-million", "mt2-glacier", "or242-mckenzie"],
        "required": ["co82-independence", "co550-million"],
        "forbidden": ["nv-extraterrestrial", "wa101-olympic"],
        "difficulty": "subjective",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Param schema & SQL builder
# ─────────────────────────────────────────────────────────────────────────────

PARAM_SCHEMA = """{
  "archetype": "twisties" | "mountain" | "coastal" | "adventure" | "scenic_byway" | "desert" | null,
  "state": "2-letter state code" | null,
  "max_technical": 0.0-1.0 | null,
  "min_traffic_score": 0.0-1.0 | null,
  "min_remoteness": 0.0-1.0 | null,
  "min_length_mi": number | null,
  "max_length_mi": number | null,
  "max_distance_mi": number | null,
  "season": "year_round" | "apr_nov" | "may_sep" | null,
  "sort_by": "curvature" | "scenic" | "technical" | "traffic" | "remoteness" | "length" | null
}"""


def params_to_sql(
    params: dict,
    user_loc: dict = USER_LOCATION,
    default_radius_mi: float = DEFAULT_RADIUS_MI,
    limit: int = 10,
) -> tuple[str, list]:
    """Convert extracted params into a parameterised SELECT.

    Location behavior:
      - If `state` is explicitly set → filter by state, IGNORE distance.
      - Otherwise → apply bounding box around user_loc with radius =
        params["max_distance_mi"] or default_radius_mi.
    """
    where, args = [], []

    def add(col, op, key):
        val = params.get(key)
        if val is not None:
            where.append(f"{col} {op} ?")
            args.append(val)

    if params.get("archetype"):
        where.append("primary_archetype = ?")
        args.append(params["archetype"])

    state_override = bool(params.get("state"))
    if state_override:
        where.append("state = ?")
        args.append(params["state"].upper())
    else:
        # Default: anchor + radius bounding box
        radius = params.get("max_distance_mi") or default_radius_mi
        lat_delta = radius / 69.0
        lng_delta = radius / 55.0
        where.append("centroid_lat BETWEEN ? AND ?")
        args.extend([user_loc["lat"] - lat_delta, user_loc["lat"] + lat_delta])
        where.append("centroid_lng BETWEEN ? AND ?")
        args.extend([user_loc["lng"] - lng_delta, user_loc["lng"] + lng_delta])

    if params.get("season"):
        where.append("season = ?")
        args.append(params["season"])

    add("technical_score",  "<=", "max_technical")
    add("traffic_score",    ">=", "min_traffic_score")
    add("remoteness_score", ">=", "min_remoteness")
    add("length_mi",        ">=", "min_length_mi")
    add("length_mi",        "<=", "max_length_mi")

    sql = "SELECT route_id FROM curated_routes"
    if where:
        sql += " WHERE " + " AND ".join(where)

    sort_map = {
        "curvature":  "curvature_score DESC",
        "scenic":     "scenic_score DESC",
        "technical":  "technical_score DESC",
        "traffic":    "traffic_score DESC",
        "remoteness": "remoteness_score DESC",
        "length":     "length_mi DESC",
    }
    if params.get("sort_by") and params["sort_by"] in sort_map:
        sql += f" ORDER BY {sort_map[params['sort_by']]}"
    else:
        sql += " ORDER BY route_id"

    sql += f" LIMIT {int(limit)}"
    return sql, args


def score_results(returned: list[str], scenario: dict) -> dict:
    """Compute precision/recall/F1 and required-hit rate."""
    expected = set(scenario["expected"])
    required = set(scenario["required"])
    forbidden = set(scenario["forbidden"])
    returned_set = set(returned)

    if not returned_set:
        return {
            "precision": 0.0, "recall": 0.0, "f1": 0.0,
            "required_hit_rate": 0.0,
            "forbidden_violations": 0,
            "returned_count": 0,
        }

    tp = len(returned_set & expected)
    precision = tp / len(returned_set)
    recall = tp / len(expected) if expected else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
    req_hit = len(returned_set & required) / len(required) if required else 1.0
    fbd = len(returned_set & forbidden)

    return {
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(f1, 3),
        "required_hit_rate": round(req_hit, 3),
        "forbidden_violations": fbd,
        "returned_count": len(returned),
    }


if __name__ == "__main__":
    # Smoke test: build DB, run a hand-crafted query per scenario, verify sensible results
    conn = build_db()
    cur = conn.cursor()
    print(f"DB built: {cur.execute('SELECT COUNT(*) FROM curated_routes').fetchone()[0]} routes")
    print(f"Scenarios: {len(SCENARIOS)}")
    print(f"Difficulties: {sorted(set(s['difficulty'] for s in SCENARIOS))}")
    # Spot-check: all required route IDs exist in DB
    all_ids = {r[0] for r in cur.execute("SELECT route_id FROM curated_routes").fetchall()}
    missing = set()
    for s in SCENARIOS:
        for rid in s["required"] + s["expected"] + s["forbidden"]:
            if rid not in all_ids:
                missing.add(rid)
    if missing:
        print(f"⚠️  Missing route IDs referenced in scenarios: {missing}")
    else:
        print("✅ All scenario route IDs exist in DB")
