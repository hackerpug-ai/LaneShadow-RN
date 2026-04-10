#!/usr/bin/env python3
"""
Test different prompting strategies for local models
Compare: complex single prompt vs broken-down tasks vs multi-agent pipeline
"""

import json
import time
from pathlib import Path
from typing import Dict, Any, List
from mlx_lm import load, generate


# Strategy 1: Simplified, step-by-step prompts
SIMPLIFIED_PROMPTS = {
    "extract_locations": """Extract the origin and destination from this request. Return JSON:
{{
  "origin": "address string",
  "destination": "address string"
}}

Request: {user_request}""",

    "add_route_preference": """You are a motorcycle route expert. Based on this request, add route preference:
{{
  "origin": "{origin}",
  "destination": "{destination}",
  "route_preference": "scenic|twisty|direct|sporty",
  "avoid_highways": true/false
}}

Request: {user_request}""",

    "add_waypoints": """Add 1-3 waypoints for this motorcycle trip between {origin} and {destination}. Return JSON:
{{
  "waypoints": ["address1", "address2"]
}}

Request: {user_request}"""
}

# Strategy 2: Multi-agent specialized prompts
SPECIALIZED_PROMPTS = {
    "location_extraction": """You extract locations. Return JSON:
{{
  "origin": "string",
  "destination": "string"
}}
Text: {text}""",

    "route_planner": """You plan motorcycle routes. Return JSON:
{{
  "route_preference": "scenic|twisty|direct|sporty",
  "avoid_highways": true/false,
  "scenic_highlights": ["string"]
}}
Text: {text}""",

    "waypoint_generator": """You suggest motorcycle stops. Return JSON with waypoint addresses:
{{
  "waypoints": ["address1", "address2", "address3"]
}}
Text: {text}"""
}

# Test case
TEST_REQUEST = "Plan a scenic motorcycle route from San Francisco to Point Reyes along the coast. I want twisty roads with ocean views and minimal highway riding."


def get_model_size(model_name: str) -> float:
    """Get model disk size in GB"""
    model_path = Path.home() / ".cache" / "huggingface" / "hub" / f"models--{model_name.replace('/', '--')}"
    if model_path.exists():
        disk_size = sum(f.stat().st_size for f in model_path.rglob('*') if f.is_file())
        return round(disk_size / (1024**3), 2)
    return 0


def run_inference(model, tokenizer, prompt: str, max_tokens: int = 256) -> Dict[str, Any]:
    """Run inference and measure performance"""
    start_time = time.time()

    try:
        response = generate(model, tokenizer, prompt=prompt, max_tokens=max_tokens, verbose=False)
        duration = time.time() - start_time

        return {
            "success": True,
            "response": response.strip(),
            "duration_seconds": round(duration, 3),
            "tokens_generated": len(response.split())
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "duration_seconds": round(time.time() - start_time, 3)
        }


def extract_json(response: str) -> Dict[str, Any]:
    """Extract JSON from response"""
    json_start = response.find('{')
    json_end = response.rfind('}')

    if json_start == -1 or json_end == -1:
        return {"success": False, "error": "No JSON found"}

    try:
        data = json.loads(response[json_start:json_end + 1])
        return {"success": True, "data": data}
    except json.JSONDecodeError as e:
        return {"success": False, "error": str(e)}


def test_single_prompt(model, tokenizer, model_name: str) -> Dict[str, Any]:
    """Test 1: Single complex prompt (baseline - already failed)"""
    print(f"\n{'='*60}")
    print("Strategy 1: Single Complex Prompt (Baseline)")
    print(f"{'='*60}")

    prompt = f"""You are a motorcycle route planner. Return JSON:
{{
  "origin": {{"address": "string", "lat": number, "lng": number}},
  "destination": {{"address": "string", "lat": number, "lng": number}},
  "route_preference": "scenic|twisty|direct|sporty",
  "avoid_highways": true/false,
  "waypoints": [{{"address": "string"}}]
}}

Request: {TEST_REQUEST}"""

    result = run_inference(model, tokenizer, prompt, max_tokens=512)
    json_result = extract_json(result.get("response", ""))

    print(f"Duration: {result['duration_seconds']}s")
    print(f"Valid JSON: {json_result['success']}")
    if json_result['success']:
        print(f"Response: {json.dumps(json_result['data'], indent=2)}")
    else:
        print(f"Error: {json_result['error']}")
        print(f"Raw: {result.get('response', '')[:200]}")

    return {
        "strategy": "single_prompt",
        "valid_json": json_result["success"],
        "duration": result["duration_seconds"],
        "data": json_result.get("data", {})
    }


def test_simplified_prompts(model, tokenizer, model_name: str) -> Dict[str, Any]:
    """Test 2: Broken-down sequential prompts"""
    print(f"\n{'='*60}")
    print("Strategy 2: Simplified Sequential Prompts")
    print(f"{'='*60}")

    final_result = {"origin": None, "destination": None, "route_preference": None, "avoid_highways": None, "waypoints": []}
    total_duration = 0

    # Step 1: Extract locations
    print("\n[Step 1] Extracting locations...")
    prompt = SIMPLIFIED_PROMPTS["extract_locations"].format(user_request=TEST_REQUEST)
    result = run_inference(model, tokenizer, prompt, max_tokens=128)
    total_duration += result["duration_seconds"]

    json_result = extract_json(result.get("response", ""))
    if json_result["success"]:
        final_result["origin"] = json_result["data"].get("origin")
        final_result["destination"] = json_result["data"].get("destination")
        print(f"  ✓ Origin: {final_result['origin']}")
        print(f"  ✓ Destination: {final_result['destination']}")
    else:
        print(f"  ✗ Failed: {json_result['error']}")
        return {"strategy": "simplified_prompts", "valid_json": False, "error": "Step 1 failed"}

    # Step 2: Add route preference
    print("\n[Step 2] Adding route preference...")
    prompt = SIMPLIFIED_PROMPTS["add_route_preference"].format(
        origin=final_result["origin"],
        destination=final_result["destination"],
        user_request=TEST_REQUEST
    )
    result = run_inference(model, tokenizer, prompt, max_tokens=128)
    total_duration += result["duration_seconds"]

    json_result = extract_json(result.get("response", ""))
    if json_result["success"]:
        final_result["route_preference"] = json_result["data"].get("route_preference")
        final_result["avoid_highways"] = json_result["data"].get("avoid_highways")
        print(f"  ✓ Preference: {final_result['route_preference']}")
        print(f"  ✓ Avoid highways: {final_result['avoid_highways']}")
    else:
        print(f"  ✗ Failed: {json_result['error']}")

    # Step 3: Add waypoints
    print("\n[Step 3] Adding waypoints...")
    prompt = SIMPLIFIED_PROMPTS["add_waypoints"].format(
        origin=final_result["origin"],
        destination=final_result["destination"],
        user_request=TEST_REQUEST
    )
    result = run_inference(model, tokenizer, prompt, max_tokens=128)
    total_duration += result["duration_seconds"]

    json_result = extract_json(result.get("response", ""))
    if json_result["success"]:
        waypoints = json_result["data"].get("waypoints", [])
        # Convert to objects if they're just strings
        if waypoints and isinstance(waypoints[0], str):
            final_result["waypoints"] = [{"address": w} for w in waypoints]
        else:
            final_result["waypoints"] = waypoints
        print(f"  ✓ Waypoints: {len(final_result['waypoints'])}")
    else:
        print(f"  ✗ Failed: {json_result['error']}")

    # Validate final result
    has_required = all([
        final_result.get("origin"),
        final_result.get("destination"),
        final_result.get("route_preference") is not None,
        final_result.get("avoid_highways") is not None
    ])

    print(f"\n{'='*60}")
    print(f"Final Result (Sequential):")
    print(f"  Valid: {has_required}")
    print(f"  Total Duration: {total_duration:.2f}s")
    print(f"  Response: {json.dumps(final_result, indent=2)}")

    return {
        "strategy": "simplified_prompts",
        "valid_json": has_required,
        "duration": total_duration,
        "data": final_result
    }


def test_multi_agent(model, tokenizer, model_name: str) -> Dict[str, Any]:
    """Test 3: Multi-agent specialized pipeline"""
    print(f"\n{'='*60}")
    print("Strategy 3: Multi-Agent Pipeline")
    print(f"{'='*60}")

    final_result = {}
    total_duration = 0

    # Agent 1: Location Extraction Specialist
    print("\n[Agent 1] Location Extraction Specialist...")
    prompt = SPECIALIZED_PROMPTS["location_extraction"].format(text=TEST_REQUEST)
    result = run_inference(model, tokenizer, prompt, max_tokens=128)
    total_duration += result["duration_seconds"]

    json_result = extract_json(result.get("response", ""))
    if json_result["success"]:
        final_result.update(json_result["data"])
        print(f"  ✓ Extracted: {json_result['data']}")
    else:
        print(f"  ✗ Failed: {json_result['error']}")
        return {"strategy": "multi_agent", "valid_json": False, "error": "Agent 1 failed"}

    # Agent 2: Route Planning Specialist
    print("\n[Agent 2] Route Planning Specialist...")
    prompt = SPECIALIZED_PROMPTS["route_planner"].format(text=TEST_REQUEST)
    result = run_inference(model, tokenizer, prompt, max_tokens=128)
    total_duration += result["duration_seconds"]

    json_result = extract_json(result.get("response", ""))
    if json_result["success"]:
        final_result.update(json_result["data"])
        print(f"  ✓ Added: {json_result['data']}")
    else:
        print(f"  ✗ Failed: {json_result['error']}")

    # Agent 3: Waypoint Generation Specialist
    print("\n[Agent 3] Waypoint Generation Specialist...")
    context = f"Route from {final_result.get('origin', 'SF')} to {final_result.get('destination', 'Point Reyes')}. {TEST_REQUEST}"
    prompt = SPECIALIZED_PROMPTS["waypoint_generator"].format(text=context)
    result = run_inference(model, tokenizer, prompt, max_tokens=128)
    total_duration += result["duration_seconds"]

    json_result = extract_json(result.get("response", ""))
    if json_result["success"]:
        final_result["waypoints"] = json_result["data"].get("waypoints", [])
        print(f"  ✓ Generated: {len(final_result['waypoints'])} waypoints")
    else:
        print(f"  ✗ Failed: {json_result['error']}")

    # Validate final result
    has_required = all([
        final_result.get("origin"),
        final_result.get("destination"),
        final_result.get("route_preference"),
        final_result.get("avoid_highways") is not None
    ])

    print(f"\n{'='*60}")
    print(f"Final Result (Multi-Agent):")
    print(f"  Valid: {has_required}")
    print(f"  Total Duration: {total_duration:.2f}s")
    print(f"  Response: {json.dumps(final_result, indent=2)}")

    return {
        "strategy": "multi_agent",
        "valid_json": has_required,
        "duration": total_duration,
        "data": final_result
    }


def main():
    print("="*60)
    print("Local Model Prompting Strategy Test")
    print("="*60)
    print(f"Test Request: {TEST_REQUEST}")
    print("="*60)

    # Test with best local model (Phi-3 had 25% success)
    model_name = "microsoft/Phi-3-mini-4k-instruct"

    print(f"\nLoading model: {model_name}")
    print(f"Disk size: {get_model_size(model_name)} GB")

    model, tokenizer = load(model_name)
    print("✓ Model loaded")

    results = []

    # Strategy 1: Single prompt (baseline)
    results.append(test_single_prompt(model, tokenizer, model_name))

    # Strategy 2: Simplified prompts
    results.append(test_simplified_prompts(model, tokenizer, model_name))

    # Strategy 3: Multi-agent
    results.append(test_multi_agent(model, tokenizer, model_name))

    # Summary
    print(f"\n{'='*60}")
    print("STRATEGY COMPARISON")
    print(f"{'='*60}")

    for r in results:
        status = "✓ VALID" if r["valid_json"] else "✗ INVALID"
        print(f"\n{r['strategy'].replace('_', ' ').title()}: {status}")
        print(f"  Duration: {r['duration']:.2f}s")
        print(f"  Valid JSON: {r['valid_json']}")

    # Save results
    output = {
        "model": model_name,
        "test_request": TEST_REQUEST,
        "strategies": results
    }

    results_path = Path(".spec/research/strategy_comparison.json")
    results_path.parent.mkdir(parents=True, exist_ok=True)

    with open(results_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n✓ Results saved to: {results_path}")


if __name__ == "__main__":
    main()
