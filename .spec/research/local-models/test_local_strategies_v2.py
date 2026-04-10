#!/usr/bin/env python3
"""
Improved prompting strategies for local models
Focus on getting real data, not schema templates
"""

import json
import time
from pathlib import Path
from mlx_lm import load, generate


# Improved prompts with examples and clearer instructions
IMPROVED_SEQUENTIAL = {
    "extract_locations": """Extract origin and destination addresses. Return JSON:
{{
  "origin": "full address",
  "destination": "full address"
}}

Example: "Route from NYC to LA" -> {{"origin": "New York City, NY", "destination": "Los Angeles, CA"}}

Your task: {user_request}""",

    "route_preference": """Based on the motorcycle trip description, determine preferences. Return JSON:
{{
  "route_preference": "scenic",
  "avoid_highways": true,
  "road_types": ["coastal", "mountain", "country roads"]
}}

Example: "I want twisty roads with ocean views" -> {{"route_preference": "scenic", "avoid_highways": true, "road_types": ["coastal", "twisty"]}}

Your task: {user_request}""",

    "waypoints": """Suggest 2-3 specific stops along this motorcycle route. Return JSON:
{{
  "waypoints": [
    {{"name": "Point Reyes Station", "reason": "Fuel and food stop"}},
    {{"name": "Muir Beach", "reason": "Scenic overlook"}}
  ]
}}

Example: "Route from SF to Point Reyes" -> {{"waypoints": [{{"name": "Sausalito", "reason": "Ferry terminal views"}}, {{"name": "Stinson Beach", "reason": "Coastal drive"}}]}}

Your task: Motorcycle trip from {origin} to {destination}. {user_request}"""
}


def run_inference(model, tokenizer, prompt: str, max_tokens: int = 256) -> dict:
    """Run inference"""
    start = time.time()
    try:
        response = generate(model, tokenizer, prompt=prompt, max_tokens=max_tokens, verbose=False)
        return {
            "success": True,
            "response": response.strip(),
            "duration": time.time() - start,
            "tokens": len(response.split())
        }
    except Exception as e:
        return {"success": False, "error": str(e), "duration": time.time() - start}


def extract_json(response: str) -> dict:
    """Extract JSON from response"""
    json_start = response.find('{')
    json_end = response.rfind('}')

    if json_start == -1 or json_end == -1:
        return {"success": False, "error": "No JSON"}

    try:
        data = json.loads(response[json_start:json_end + 1])
        return {"success": True, "data": data}
    except json.JSONDecodeError as e:
        return {"success": False, "error": str(e)}


def test_improved_sequential(model, tokenizer) -> dict:
    """Test improved sequential prompting with examples"""
    print("\n" + "="*60)
    print("IMPROVED SEQUENTIAL PROMPTING (with examples)")
    print("="*60)

    request = "Plan a scenic motorcycle route from San Francisco to Point Reyes along the coast. I want twisty roads with ocean views and minimal highway riding."

    result = {}
    total_time = 0

    # Step 1: Locations
    print("\n[1] Extracting locations...")
    prompt = IMPROVED_SEQUENTIAL["extract_locations"].format(user_request=request)
    resp = run_inference(model, tokenizer, prompt, 128)
    total_time += resp["duration"]

    json_data = extract_json(resp.get("response", ""))
    if json_data["success"]:
        result.update(json_data["data"])
        print(f"  ✓ {json_data['data']}")
        print(f"  Raw: {resp['response'][:100]}")
    else:
        print(f"  ✗ {json_data['error']}")
        print(f"  Raw: {resp['response'][:200]}")
        return {"strategy": "improved_sequential", "valid": False, "error": "Step 1 failed"}

    # Step 2: Preferences
    print("\n[2] Getting route preferences...")
    prompt = IMPROVED_SEQUENTIAL["route_preference"].format(user_request=request)
    resp = run_inference(model, tokenizer, prompt, 128)
    total_time += resp["duration"]

    json_data = extract_json(resp.get("response", ""))
    if json_data["success"]:
        result.update(json_data["data"])
        print(f"  ✓ {json_data['data']}")
        print(f"  Raw: {resp['response'][:150]}")
    else:
        print(f"  ✗ {json_data['error']}")
        print(f"  Raw: {resp['response'][:200]}")

    # Step 3: Waypoints (the tricky part)
    print("\n[3] Generating waypoints...")
    prompt = IMPROVED_SEQUENTIAL["waypoints"].format(
        origin=result.get("origin", "SF"),
        destination=result.get("destination", "Point Reyes"),
        user_request=request
    )
    resp = run_inference(model, tokenizer, prompt, 256)
    total_time += resp["duration"]

    json_data = extract_json(resp.get("response", ""))
    if json_data["success"]:
        result["waypoints"] = json_data["data"].get("waypoints", [])
        print(f"  ✓ Found {len(result['waypoints'])} waypoints")
        for wp in result["waypoints"][:3]:
            print(f"    - {wp}")
        print(f"  Raw: {resp['response'][:200]}")
    else:
        print(f"  ✗ {json_data['error']}")
        print(f"  Raw: {resp['response'][:300]}")
        # Don't fail - just skip waypoints

    # Check for real data vs templates
    has_real_waypoints = any(
        wp.get("name", "") not in ["", "string", "name1", "name2"]
        for wp in result.get("waypoints", [])
    )

    print(f"\n{'='*60}")
    print(f"RESULT:")
    print(f"  Valid structure: {all(result.get(k) for k in ['origin', 'destination'])}")
    print(f"  Real waypoints: {has_real_waypoints}")
    print(f"  Total time: {total_time:.2f}s")
    print(f"\nFull result:")
    print(json.dumps(result, indent=2))

    return {
        "strategy": "improved_sequential",
        "valid": True,
        "has_real_data": has_real_waypoints,
        "duration": total_time,
        "data": result
    }


def main():
    print("="*60)
    print("Testing Improved Local Model Strategies")
    print("="*60)

    model_name = "microsoft/Phi-3-mini-4k-instruct"
    print(f"\nLoading: {model_name}")
    model, tokenizer = load(model_name)
    print("✓ Ready\n")

    result = test_improved_sequential(model, tokenizer)

    # Save
    out = Path(".spec/research/improved_strategy_result.json")
    with open(out, 'w') as f:
        json.dump(result, f, indent=2)
    print(f"\n✓ Saved: {out}")


if __name__ == "__main__":
    main()
