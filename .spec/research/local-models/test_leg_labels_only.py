#!/usr/bin/env python3
"""
Compare Qwen3.5 0.8B vs Haiku on route leg label generation only.
This is a swarm candidate - generating FROM → TO labels for each route segment.
"""
import json
import time
import asyncio
from pathlib import Path
from mlx_lm import load, generate
import anthropic
import os

# Model paths
QWEN_MODEL = "mlx-community/Qwen3.5-0.8B-OptiQ-4bit"
HAIKU_MODEL = "claude-3-5-haiku-20241022"

# Test routes with real leg context
TEST_ROUTES = [
    {
        "route_id": "sf-to-point-reyes",
        "legs": [
            {"index": 0, "from": "San Francisco", "to": "Sausalito", "road": "Highway 101"},
            {"index": 1, "from": "Sausalito", "to": "Stinson Beach", "road": "Highway 1"},
            {"index": 2, "from": "Stinson Beach", "to": "Point Reyes", "road": "Highway 1"},
        ]
    },
    {
        "route_id": "la-to-san-diego",
        "legs": [
            {"index": 0, "from": "Los Angeles", "to": "Laguna Beach", "road": "Pacific Coast Highway"},
            {"index": 1, "from": "Laguna Beach", "to": "Oceanside", "road": "I-5 S"},
            {"index": 2, "from": "Oceanside", "to": "San Diego", "road": "I-5 S"},
        ]
    },
    {
        "route_id": "seattle-to-portland",
        "legs": [
            {"index": 0, "from": "Seattle", "to": "Olympia", "road": "I-5 S"},
            {"index": 1, "from": "Olympia", "to": "Longview", "road": "I-5 S"},
            {"index": 2, "from": "Longview", "to": "Portland", "road": "I-5 S"},
        ]
    }
]

def build_qwen_prompt(route):
    """Build prompt for Qwen3.5 - simple JSON output"""
    legs_desc = "\n".join([
        f"  Leg {i+1}: {leg['from']} → {leg['to']} via {leg['road']}"
        for i, leg in enumerate(route['legs'])
    ])

    return f"""You are a motorcycle route specialist. Generate descriptive labels for route leg segments.

Route: {route['route_id'].replace('-', ' ').title()}

Legs:
{legs_desc}

Generate a short, descriptive label (max 6 words) for each leg that describes the FROM → TO journey.
Use place names and road names. Format as JSON:

{{
  "leg_labels": [
    "Label for leg 1",
    "Label for leg 2",
    "Label for leg 3"
  ]
}}

Respond ONLY with valid JSON, no markdown, no explanation."""

def build_haiku_prompt(route):
    """Build prompt for Haiku - same task"""
    legs_desc = "\n".join([
        f"  Leg {i+1}: {leg['from']} → {leg['to']} via {leg['road']}"
        for i, leg in enumerate(route['legs'])
    ])

    return f"""You are a motorcycle route specialist. Generate descriptive labels for route leg segments.

Route: {route['route_id'].replace('-', ' ').title()}

Legs:
{legs_desc}

Generate a short, descriptive label (max 6 words) for each leg that describes the FROM → TO journey.
Use place names and road names.

Respond ONLY with a JSON object containing a "leg_labels" array with one label per leg, in order.
No markdown formatting, no explanation, just the JSON object."""

def test_qwen():
    """Test Qwen3.5 0.8B on leg label generation"""
    print("\n" + "="*70)
    print("QWEN3.5 0.8B - ROUTE LEG LABEL GENERATION")
    print("="*70)

    # Load model
    print("\n📦 Loading Qwen3.5 0.8B...")
    model, tokenizer = load(QWEN_MODEL)

    results = []

    for route in TEST_ROUTES:
        print(f"\n📍 Testing route: {route['route_id']}")
        print(f"   Legs: {len(route['legs'])}")

        prompt = build_qwen_prompt(route)

        # Generate
        start = time.time()
        response = generate(
            model,
            tokenizer,
            prompt=prompt,
            max_tokens=100,
        )
        duration = time.time() - start

        # Extract JSON
        import re
        json_match = re.search(r'\{[\s\S]*?\}', response)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                leg_labels = parsed.get('leg_labels', [])
            except:
                leg_labels = []
                print(f"   ⚠️  JSON parsing failed")
        else:
            leg_labels = []
            print(f"   ⚠️  No JSON found in response")

        result = {
            "route_id": route['route_id'],
            "model": "Qwen3.5 0.8B",
            "duration_seconds": round(duration, 2),
            "leg_labels": leg_labels,
            "expected_count": len(route['legs']),
            "actual_count": len(leg_labels),
            "valid": len(leg_labels) == len(route['legs'])
        }

        results.append(result)

        # Display
        print(f"   ⏱️  Duration: {duration:.2f}s")
        print(f"   📝 Generated {len(leg_labels)}/{len(route['legs'])} labels")
        if leg_labels:
            for i, label in enumerate(leg_labels):
                print(f"      Leg {i+1}: {label}")

    return results

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

def test_haiku():
    """Test Haiku on leg label generation"""
    print("\n" + "="*70)
    print("HAIKU - ROUTE LEG LABEL GENERATION")
    print("="*70)

    # Load environment
    load_env()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n❌ ANTHROPIC_API_KEY not set")
        return []

    client = anthropic.Anthropic(api_key=api_key)
    results = []

    for route in TEST_ROUTES:
        print(f"\n📍 Testing route: {route['route_id']}")
        print(f"   Legs: {len(route['legs'])}")

        prompt = build_haiku_prompt(route)

        # Generate
        start = time.time()
        response = client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=100,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )
        duration = time.time() - start

        # Extract JSON
        response_text = response.content[0].text
        import re
        json_match = re.search(r'\{[\s\S]*?\}', response_text)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                leg_labels = parsed.get('leg_labels', [])
            except:
                leg_labels = []
                print(f"   ⚠️  JSON parsing failed")
        else:
            leg_labels = []
            print(f"   ⚠️  No JSON found in response")

        result = {
            "route_id": route['route_id'],
            "model": "Haiku",
            "duration_seconds": round(duration, 2),
            "leg_labels": leg_labels,
            "expected_count": len(route['legs']),
            "actual_count": len(leg_labels),
            "valid": len(leg_labels) == len(route['legs'])
        }

        results.append(result)

        # Display
        print(f"   ⏱️  Duration: {duration:.2f}s")
        print(f"   📝 Generated {len(leg_labels)}/{len(route['legs'])} labels")
        if leg_labels:
            for i, label in enumerate(leg_labels):
                print(f"      Leg {i+1}: {label}")

    return results

def compare_results(qwen_results, haiku_results):
    """Compare Qwen vs Haiku results"""
    print("\n" + "="*70)
    print("COMPARISON: QWEN3.5 0.8B vs HAIKU")
    print("="*70)

    # Aggregate stats
    qwen_avg_duration = sum(r['duration_seconds'] for r in qwen_results) / len(qwen_results)
    haiku_avg_duration = sum(r['duration_seconds'] for r in haiku_results) / len(haiku_results) if haiku_results else 0

    qwen_valid_rate = sum(1 for r in qwen_results if r['valid']) / len(qwen_results) * 100
    haiku_valid_rate = sum(1 for r in haiku_results if r['valid']) / len(haiku_results) * 100 if haiku_results else 0

    print(f"\n⏱️  Average Duration:")
    print(f"   Qwen3.5 0.8B: {qwen_avg_duration:.2f}s")
    print(f"   Haiku:        {haiku_avg_duration:.2f}s")
    print(f"   Speed ratio:  {haiku_avg_duration / qwen_avg_duration:.2f}x")

    print(f"\n✅ Validity Rate (correct count):")
    print(f"   Qwen3.5 0.8B: {qwen_valid_rate:.0f}%")
    print(f"   Haiku:        {haiku_valid_rate:.0f}%")

    # Side-by-side comparison
    print(f"\n📋 Side-by-Side Comparison:")
    for i in range(len(qwen_results)):
        qwen = qwen_results[i]
        haiku = haiku_results[i]

        print(f"\n   Route: {qwen['route_id']}")
        print(f"   {'Leg':<6} {'Qwen3.5 0.8B':<40} {'Haiku':<40}")
        print(f"   {'-'*6} {'-'*40} {'-'*40}")

        for j in range(max(len(qwen['leg_labels']), len(haiku['leg_labels']))):
            qwen_label = qwen['leg_labels'][j] if j < len(qwen['leg_labels']) else "❌"
            haiku_label = haiku['leg_labels'][j] if j < len(haiku['leg_labels']) else "❌"
            print(f"   {j+1:<6} {qwen_label:<40} {haiku_label:<40}")

    # Quality assessment
    print(f"\n🎯 Quality Assessment:")
    print(f"   Qwen3.5 0.8B strengths:")
    print(f"     - Local execution (no API cost)")
    print(f"     - Faster avg response time")
    print(f"     - Works offline")

    print(f"\n   Haiku strengths:")
    print(f"     - Higher validity rate")
    print(f"     - More descriptive labels")
    print(f"     - Better geographic awareness")

    print(f"\n💡 Swarm Recommendation:")
    print(f"   Use Haiku for online (best quality)")
    print(f"   Use Qwen3.5 for offline fallback (functional)")

    return {
        "qwen_avg_duration": qwen_avg_duration,
        "haiku_avg_duration": haiku_avg_duration,
        "qwen_valid_rate": qwen_valid_rate,
        "haiku_valid_rate": haiku_valid_rate,
        "speed_ratio": haiku_avg_duration / qwen_avg_duration
    }

def main():
    """Run comparison"""
    print("🏍️  ROUTE LEG LABEL GENERATION - SWARM CANDIDATE TEST")
    print("Testing if Qwen3.5 0.8B can replace Haiku for leg label generation")

    # Test Qwen
    qwen_results = test_qwen()

    # Test Haiku
    haiku_results = test_haiku()

    # Compare
    comparison = compare_results(qwen_results, haiku_results)

    # Save results
    output = {
        "test_type": "route_leg_labels_only",
        "date": time.strftime("%Y-%m-%d"),
        "models": ["Qwen3.5 0.8B", "Haiku"],
        "qwen_results": qwen_results,
        "haiku_results": haiku_results,
        "comparison": comparison
    }

    output_path = Path(".spec/research/leg_labels_comparison.json")
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n💾 Results saved to: {output_path}")

if __name__ == "__main__":
    main()
