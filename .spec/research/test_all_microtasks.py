#!/usr/bin/env python3
"""
Comprehensive micro-task swarm candidate testing.
Tests all 4 sub-tasks from enrichRoute: labels, rationales, highlights, legLabels.
Compares Qwen3.5 0.8B vs Haiku on each task independently.
"""
import json
import time
from pathlib import Path
from mlx_lm import load, generate
import anthropic
import os
import re

# Model paths
QWEN_MODEL = "mlx-community/Qwen3.5-0.8B-OptiQ-4bit"
HAIKU_MODEL = "claude-3-5-haiku-20241022"

# Test routes
TEST_ROUTES = [
    {
        "route_id": "sf-to-point-reyes",
        "waypoints": [
            {"name": "San Francisco", "type": "city"},
            {"name": "Sausalito", "type": "town"},
            {"name": "Stinson Beach", "type": "town"},
            {"name": "Point Reyes", "type": "town"}
        ],
        "stats": {
            "distanceMeters": 96560,  # ~60 miles
            "durationSeconds": 7200    # ~2 hours
        },
        "preferences": {
            "scenicBias": "coastal",
            "avoidHighways": True
        },
        "legContext": [
            {"index": 0, "from": "San Francisco", "to": "Sausalito", "road": "Highway 101"},
            {"index": 1, "from": "Sausalito", "to": "Stinson Beach", "road": "Highway 1"},
            {"index": 2, "from": "Stinson Beach", "to": "Point Reyes", "road": "Highway 1"}
        ]
    },
    {
        "route_id": "la-to-san-diego",
        "waypoints": [
            {"name": "Los Angeles", "type": "city"},
            {"name": "Laguna Beach", "type": "town"},
            {"name": "Oceanside", "type": "town"},
            {"name": "San Diego", "type": "city"}
        ],
        "stats": {
            "distanceMeters": 193120,  # ~120 miles
            "durationSeconds": 10800   # ~3 hours
        },
        "preferences": {
            "scenicBias": "coastal",
            "avoidHighways": False
        },
        "legContext": [
            {"index": 0, "from": "Los Angeles", "to": "Laguna Beach", "road": "Pacific Coast Highway"},
            {"index": 1, "from": "Laguna Beach", "to": "Oceanside", "road": "I-5 S"},
            {"index": 2, "from": "Oceanside", "to": "San Diego", "road": "I-5 S"}
        ]
    },
    {
        "route_id": "seattle-to-portland",
        "waypoints": [
            {"name": "Seattle", "type": "city"},
            {"name": "Olympia", "type": "town"},
            {"name": "Longview", "type": "town"},
            {"name": "Portland", "type": "city"}
        ],
        "stats": {
            "distanceMeters": 273588,  # ~170 miles
            "durationSeconds": 10800   # ~3 hours
        },
        "preferences": {
            "scenicBias": "default",
            "avoidHighways": False
        },
        "legContext": [
            {"index": 0, "from": "Seattle", "to": "Olympia", "road": "I-5 S"},
            {"index": 1, "from": "Olympia", "to": "Longview", "road": "I-5 S"},
            {"index": 2, "from": "Longview", "to": "Portland", "road": "I-5 S"}
        ]
    }
]

def load_env():
    """Load .env.local file"""
    env_path = Path(".env.local")
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# =============================================================================
# Micro-Task 1: Route Labels
# =============================================================================

def test_route_labels_qwen(model, tokenizer):
    """Test Qwen3.5 on route label generation"""
    print("\n" + "="*70)
    print("MICRO-TASK 1: ROUTE LABELS (Qwen3.5 0.8B)")
    print("="*70)

    results = []
    for route in TEST_ROUTES:
        waypoints_str = ", ".join([w["name"] for w in route["waypoints"]])
        distance = f"{route['stats']['distanceMeters'] / 1609.34:.1f} miles"

        prompt = f"""Generate a punchy, memorable name for this motorcycle route (max 8 words).

Route: {waypoints_str}
Distance: {distance}
Scenic bias: {route['preferences'].get('scenicBias', 'default')}

Respond ONLY with the route name, no explanation."""

        start = time.time()
        response = generate(model, tokenizer, prompt=prompt, max_tokens=50)
        duration = time.time() - start

        label = response.strip().strip('"')

        results.append({
            "route_id": route["route_id"],
            "label": label,
            "duration_seconds": round(duration, 2)
        })

        print(f"\n📍 {route['route_id']}: {label}")
        print(f"   ⏱️  {duration:.2f}s")

    return results

def test_route_labels_haiku(client):
    """Test Haiku on route label generation"""
    print("\n" + "="*70)
    print("MICRO-TASK 1: ROUTE LABELS (Haiku)")
    print("="*70)

    results = []
    for route in TEST_ROUTES:
        waypoints_str = ", ".join([w["name"] for w in route["waypoints"]])
        distance = f"{route['stats']['distanceMeters'] / 1609.34:.1f} miles"

        prompt = f"""Generate a punchy, memorable name for this motorcycle route (max 8 words).

Route: {waypoints_str}
Distance: {distance}
Scenic bias: {route['preferences'].get('scenicBias', 'default')}

Respond ONLY with the route name, no explanation."""

        start = time.time()
        response = client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=50,
            messages=[{"role": "user", "content": prompt}]
        )
        duration = time.time() - start

        label = response.content[0].text.strip().strip('"')

        results.append({
            "route_id": route["route_id"],
            "label": label,
            "duration_seconds": round(duration, 2)
        })

        print(f"\n📍 {route['route_id']}: {label}")
        print(f"   ⏱️  {duration:.2f}s")

    return results

# =============================================================================
# Micro-Task 2: Route Rationales
# =============================================================================

def test_route_rationales_qwen(model, tokenizer):
    """Test Qwen3.5 on route rationale generation"""
    print("\n" + "="*70)
    print("MICRO-TASK 2: ROUTE RATIONALES (Qwen3.5 0.8B)")
    print("="*70)

    results = []
    for route in TEST_ROUTES:
        waypoints_str = ", ".join([w["name"] for w in route["waypoints"]])
        scenic_bias = route['preferences'].get('scenicBias', 'default')

        prompt = f"""Explain why this motorcycle route is scenic (1-2 sentences).

Route: {waypoints_str}
Scenic bias: {scenic_bias}

Mention specific waypoints in your explanation.
Respond ONLY with the rationale, no explanation."""

        start = time.time()
        response = generate(model, tokenizer, prompt=prompt, max_tokens=100)
        duration = time.time() - start

        rationale = response.strip().strip('"')

        results.append({
            "route_id": route["route_id"],
            "rationale": rationale,
            "duration_seconds": round(duration, 2)
        })

        print(f"\n📍 {route['route_id']}: {rationale}")
        print(f"   ⏱️  {duration:.2f}s")

    return results

def test_route_rationales_haiku(client):
    """Test Haiku on route rationale generation"""
    print("\n" + "="*70)
    print("MICRO-TASK 2: ROUTE RATIONALES (Haiku)")
    print("="*70)

    results = []
    for route in TEST_ROUTES:
        waypoints_str = ", ".join([w["name"] for w in route["waypoints"]])
        scenic_bias = route['preferences'].get('scenicBias', 'default')

        prompt = f"""Explain why this motorcycle route is scenic (1-2 sentences).

Route: {waypoints_str}
Scenic bias: {scenic_bias}

Mention specific waypoints in your explanation.
Respond ONLY with the rationale, no explanation."""

        start = time.time()
        response = client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        duration = time.time() - start

        rationale = response.content[0].text.strip().strip('"')

        results.append({
            "route_id": route["route_id"],
            "rationale": rationale,
            "duration_seconds": round(duration, 2)
        })

        print(f"\n📍 {route['route_id']}: {rationale}")
        print(f"   ⏱️  {duration:.2f}s")

    return results

# =============================================================================
# Micro-Task 3: Scenic Highlights
# =============================================================================

def test_highlights_qwen(model, tokenizer):
    """Test Qwen3.5 on scenic highlights generation"""
    print("\n" + "="*70)
    print("MICRO-TASK 3: SCENIC HIGHLIGHTS (Qwen3.5 0.8B)")
    print("="*70)

    results = []
    for route in TEST_ROUTES:
        waypoints_str = ", ".join([w["name"] for w in route["waypoints"]])

        prompt = f"""Generate 3-5 short phrases (max 4 words each) highlighting scenic features of this motorcycle route.

Route: {waypoints_str}

Respond ONLY as a JSON array of strings, no markdown:
{{
  "highlights": ["phrase 1", "phrase 2", "phrase 3"]
}}"""

        start = time.time()
        response = generate(model, tokenizer, prompt=prompt, max_tokens=100)
        duration = time.time() - start

        # Extract JSON
        json_match = re.search(r'\{[\s\S]*?\}', response)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                highlights = parsed.get("highlights", [])
            except:
                highlights = []
        else:
            highlights = []

        results.append({
            "route_id": route["route_id"],
            "highlights": highlights,
            "count": len(highlights),
            "duration_seconds": round(duration, 2)
        })

        print(f"\n📍 {route['route_id']}: {highlights}")
        print(f"   ⏱️  {duration:.2f}s")

    return results

def test_highlights_haiku(client):
    """Test Haiku on scenic highlights generation"""
    print("\n" + "="*70)
    print("MICRO-TASK 3: SCENIC HIGHLIGHTS (Haiku)")
    print("="*70)

    results = []
    for route in TEST_ROUTES:
        waypoints_str = ", ".join([w["name"] for w in route["waypoints"]])

        prompt = f"""Generate 3-5 short phrases (max 4 words each) highlighting scenic features of this motorcycle route.

Route: {waypoints_str}

Respond ONLY as a JSON object with a "highlights" array, no markdown:
{{
  "highlights": ["phrase 1", "phrase 2", "phrase 3"]
}}"""

        start = time.time()
        response = client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        duration = time.time() - start

        # Extract JSON
        response_text = response.content[0].text
        json_match = re.search(r'\{[\s\S]*?\}', response_text)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                highlights = parsed.get("highlights", [])
            except:
                highlights = []
        else:
            highlights = []

        results.append({
            "route_id": route["route_id"],
            "highlights": highlights,
            "count": len(highlights),
            "duration_seconds": round(duration, 2)
        })

        print(f"\n📍 {route['route_id']}: {highlights}")
        print(f"   ⏱️  {duration:.2f}s")

    return results

# =============================================================================
# Micro-Task 4: Leg Labels (Already validated, including for completeness)
# =============================================================================

def test_leg_labels_qwen(model, tokenizer):
    """Test Qwen3.5 on leg label generation"""
    print("\n" + "="*70)
    print("MICRO-TASK 4: LEG LABELS (Qwen3.5 0.8B)")
    print("="*70)

    results = []
    for route in TEST_ROUTES:
        legs_desc = "\n".join([
            f"  Leg {i+1}: {leg['from']} → {leg['to']} via {leg['road']}"
            for i, leg in enumerate(route['legContext'])
        ])

        prompt = f"""Generate descriptive labels (max 6 words) for each route leg.

{route['route_id'].replace('-', ' ').title()}
{legs_desc}

Respond ONLY as JSON:
{{
  "leg_labels": ["label 1", "label 2", "label 3"]
}}"""

        start = time.time()
        response = generate(model, tokenizer, prompt=prompt, max_tokens=100)
        duration = time.time() - start

        # Extract JSON
        json_match = re.search(r'\{[\s\S]*?\}', response)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                leg_labels = parsed.get("leg_labels", [])
            except:
                leg_labels = []
        else:
            leg_labels = []

        results.append({
            "route_id": route["route_id"],
            "leg_labels": leg_labels,
            "expected_count": len(route['legContext']),
            "actual_count": len(leg_labels),
            "valid": len(leg_labels) == len(route['legContext']),
            "duration_seconds": round(duration, 2)
        })

        print(f"\n📍 {route['route_id']}: {leg_labels}")
        print(f"   ⏱️  {duration:.2f}s")

    return results

def test_leg_labels_haiku(client):
    """Test Haiku on leg label generation"""
    print("\n" + "="*70)
    print("MICRO-TASK 4: LEG LABELS (Haiku)")
    print("="*70)

    results = []
    for route in TEST_ROUTES:
        legs_desc = "\n".join([
            f"  Leg {i+1}: {leg['from']} → {leg['to']} via {leg['road']}"
            for i, leg in enumerate(route['legContext'])
        ])

        prompt = f"""Generate descriptive labels (max 6 words) for each route leg.

{route['route_id'].replace('-', ' ').title()}
{legs_desc}

Respond ONLY as JSON:
{{
  "leg_labels": ["label 1", "label 2", "label 3"]
}}"""

        start = time.time()
        response = client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        duration = time.time() - start

        # Extract JSON
        response_text = response.content[0].text
        json_match = re.search(r'\{[\s\S]*?\}', response_text)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                leg_labels = parsed.get("leg_labels", [])
            except:
                leg_labels = []
        else:
            leg_labels = []

        results.append({
            "route_id": route["route_id"],
            "leg_labels": leg_labels,
            "expected_count": len(route['legContext']),
            "actual_count": len(leg_labels),
            "valid": len(leg_labels) == len(route['legContext']),
            "duration_seconds": round(duration, 2)
        })

        print(f"\n📍 {route['route_id']}: {leg_labels}")
        print(f"   ⏱️  {duration:.2f}s")

    return results

# =============================================================================
# Comparison & Analysis
# =============================================================================

def compare_results(all_results):
    """Compare all micro-task results"""
    print("\n" + "="*70)
    print("COMPREHENSIVE RESULTS SUMMARY")
    print("="*70)

    # Extract results
    qwen_labels = all_results["qwen"]["labels"]
    haiku_labels = all_results["haiku"]["labels"]
    qwen_rationales = all_results["qwen"]["rationales"]
    haiku_rationales = all_results["haiku"]["rationales"]
    qwen_highlights = all_results["qwen"]["highlights"]
    haiku_highlights = all_results["haiku"]["highlights"]
    qwen_legs = all_results["qwen"]["leg_labels"]
    haiku_legs = all_results["haiku"]["leg_labels"]

    # Calculate averages
    def avg_duration(results):
        return sum(r["duration_seconds"] for r in results) / len(results)

    # Table header
    print(f"\n{'Micro-Task':<20} {'Qwen Duration':<15} {'Haiku Duration':<15} {'Speed Ratio':<12} {'Qwen Valid':<12} {'Haiku Valid':<12}")
    print("-" * 100)

    # Micro-task 1: Route Labels
    qwen_label_dur = avg_duration(qwen_labels)
    haiku_label_dur = avg_duration(haiku_labels)
    print(f"{'Route Labels':<20} {qwen_label_dur:<15.2f} {haiku_label_dur:<15.2f} {haiku_label_dur/qwen_label_dur:<12.2f} {'N/A':<12} {'N/A':<12}")

    # Micro-task 2: Route Rationales
    qwen_rat_dur = avg_duration(qwen_rationales)
    haiku_rat_dur = avg_duration(haiku_rationales)
    print(f"{'Route Rationales':<20} {qwen_rat_dur:<15.2f} {haiku_rat_dur:<15.2f} {haiku_rat_dur/qwen_rat_dur:<12.2f} {'N/A':<12} {'N/A':<12}")

    # Micro-task 3: Scenic Highlights
    qwen_high_dur = avg_duration(qwen_highlights)
    haiku_high_dur = avg_duration(haiku_highlights)
    qwen_high_valid = sum(1 for r in qwen_highlights if r["count"] >= 3) / len(qwen_highlights) * 100
    haiku_high_valid = sum(1 for r in haiku_highlights if r["count"] >= 3) / len(haiku_highlights) * 100
    print(f"{'Scenic Highlights':<20} {qwen_high_dur:<15.2f} {haiku_high_dur:<15.2f} {haiku_high_dur/qwen_high_dur:<12.2f} {qwen_high_valid:<12.0f}% {haiku_high_valid:<12.0f}%")

    # Micro-task 4: Leg Labels
    qwen_leg_dur = avg_duration(qwen_legs)
    haiku_leg_dur = avg_duration(haiku_legs)
    qwen_leg_valid = sum(1 for r in qwen_legs if r["valid"]) / len(qwen_legs) * 100
    haiku_leg_valid = sum(1 for r in haiku_legs if r["valid"]) / len(haiku_legs) * 100
    print(f"{'Leg Labels':<20} {qwen_leg_dur:<15.2f} {haiku_leg_dur:<15.2f} {haiku_leg_dur/qwen_leg_dur:<12.2f} {qwen_leg_valid:<12.0f}% {haiku_leg_valid:<12.0f}%")

    # Side-by-side quality comparison
    print(f"\n{'='*70}")
    print("QUALITY COMPARISON (Side-by-Side)")
    print("="*70)

    for i, route_id in enumerate([r["route_id"] for r in TEST_ROUTES]):
        print(f"\n📍 Route: {route_id}")
        print("-" * 70)

        # Labels
        print(f"  Label:")
        print(f"    Qwen:  {qwen_labels[i]['label']}")
        print(f"    Haiku: {haiku_labels[i]['label']}")

        # Rationales
        print(f"  Rationale:")
        print(f"    Qwen:  {qwen_rationales[i]['rationale']}")
        print(f"    Haiku: {haiku_rationales[i]['rationale']}")

        # Highlights
        print(f"  Highlights:")
        print(f"    Qwen:  {qwen_highlights[i]['highlights']}")
        print(f"    Haiku: {haiku_highlights[i]['highlights']}")

        # Leg Labels
        print(f"  Leg Labels:")
        print(f"    Qwen:  {qwen_legs[i]['leg_labels']}")
        print(f"    Haiku: {haiku_legs[i]['leg_labels']}")

    # Swarm recommendations
    print(f"\n{'='*70}")
    print("SWARM RECOMMENDATIONS")
    print("="*70)

    recommendations = [
        {
            "task": "Route Labels",
            "qwen_speed": qwen_label_dur,
            "haiku_speed": haiku_label_dur,
            "speed_ratio": haiku_label_dur / qwen_label_dur,
            "recommendation": "Hybrid" if qwen_label_dur < haiku_label_dur else "Haiku"
        },
        {
            "task": "Route Rationales",
            "qwen_speed": qwen_rat_dur,
            "haiku_speed": haiku_rat_dur,
            "speed_ratio": haiku_rat_dur / qwen_rat_dur,
            "recommendation": "Hybrid" if qwen_rat_dur < haiku_rat_dur else "Haiku"
        },
        {
            "task": "Scenic Highlights",
            "qwen_speed": qwen_high_dur,
            "haiku_speed": haiku_high_dur,
            "speed_ratio": haiku_high_dur / qwen_high_dur,
            "qwen_valid": qwen_high_valid,
            "recommendation": "Qwen3.5" if qwen_high_valid >= 80 else "Haiku"
        },
        {
            "task": "Leg Labels",
            "qwen_speed": qwen_leg_dur,
            "haiku_speed": haiku_leg_dur,
            "speed_ratio": haiku_leg_dur / qwen_leg_dur,
            "qwen_valid": qwen_leg_valid,
            "recommendation": "Qwen3.5" if qwen_leg_valid >= 95 else "Haiku"
        }
    ]

    for rec in recommendations:
        status = "✅ VALIDATED" if rec["recommendation"] == "Qwen3.5" else "⚠️ NEEDS TESTING" if rec["recommendation"] == "Hybrid" else "🔄 USE HAIKU"
        print(f"\n{rec['task']}:")
        print(f"   Speed: Qwen {rec['qwen_speed']:.2f}s vs Haiku {rec['haiku_speed']:.2f}s ({rec['speed_ratio']:.2f}x)")
        if "qwen_valid" in rec:
            print(f"   Validity: Qwen {rec['qwen_valid']:.0f}%")
        print(f"   Recommendation: {rec['recommendation']} {status}")

    return {
        "recommendations": recommendations,
        "summary": {
            "qwen_total_duration": qwen_label_dur + qwen_rat_dur + qwen_high_dur + qwen_leg_dur,
            "haiku_total_duration": haiku_label_dur + haiku_rat_dur + haiku_high_dur + haiku_leg_dur
        }
    }

# =============================================================================
# Main
# =============================================================================

def main():
    """Run comprehensive micro-task comparison"""
    print("🏍️  COMPREHENSIVE MICRO-TASK SWARM ANALYSIS")
    print("Testing all 4 sub-tasks from enrichRoute with Qwen3.5 0.8B vs Haiku")

    # Load environment
    load_env()

    # Initialize Qwen model
    print("\n📦 Loading Qwen3.5 0.8B...")
    model, tokenizer = load(QWEN_MODEL)

    # Initialize Haiku client
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    # Run all tests
    all_results = {
        "qwen": {
            "labels": test_route_labels_qwen(model, tokenizer),
            "rationales": test_route_rationales_qwen(model, tokenizer),
            "highlights": test_highlights_qwen(model, tokenizer),
            "leg_labels": test_leg_labels_qwen(model, tokenizer)
        },
        "haiku": {
            "labels": test_route_labels_haiku(client),
            "rationales": test_route_rationales_haiku(client),
            "highlights": test_highlights_haiku(client),
            "leg_labels": test_leg_labels_haiku(client)
        }
    }

    # Compare and analyze
    comparison = compare_results(all_results)

    # Save results
    output = {
        "test_type": "comprehensive_microtask_swarm_analysis",
        "date": time.strftime("%Y-%m-%d"),
        "models": ["Qwen3.5 0.8B", "Haiku"],
        "results": all_results,
        "comparison": comparison
    }

    output_path = Path(".spec/research/microtask_swarm_analysis.json")
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n💾 Results saved to: {output_path}")

if __name__ == "__main__":
    main()
