#!/usr/bin/env python3
"""
Final version: robust JSON extraction for local models
Handles markdown code blocks, extra text, and partial JSON
"""

import json
import time
import re
from pathlib import Path
from mlx_lm import load, generate


# Prompts with explicit instructions to minimize extra text
FINAL_PROMPTS = {
    "extract_locations": """Extract locations. Return ONLY valid JSON:
{{
  "origin": "full address",
  "destination": "full address"
}}

{user_request}""",

    "route_preference": """Determine motorcycle route preferences. Return ONLY valid JSON:
{{
  "route_preference": "scenic|twisty|direct|sporty",
  "avoid_highways": true|false
}}

{user_request}""",

    "waypoints": """Suggest 2-3 motorcycle stops. Return ONLY valid JSON:
{{
  "waypoints": [{{"name": "Place Name", "reason": "Why stop"}}]
}}

Route: {origin} to {destination}
Context: {user_request}"""
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


def extract_json_robust(response: str) -> dict:
    """Robust JSON extraction that handles markdown, extra text, etc."""

    # Try 1: Find JSON between ```json and ``` markers
    json_match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group(1))
            return {"success": True, "data": data, "method": "markdown"}
        except json.JSONDecodeError:
            pass

    # Try 2: Find JSON between ``` and ``` markers
    json_match = re.search(r'```\s*(\{.*?\})\s*```', response, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group(1))
            return {"success": True, "data": data, "method": "code_block"}
        except json.JSONDecodeError:
            pass

    # Try 3: Find outermost braces in the entire response
    json_start = response.find('{')
    json_end = response.rfind('}')

    if json_start != -1 and json_end != -1 and json_end > json_start:
        json_str = response[json_start:json_end + 1]
        try:
            data = json.loads(json_str)
            return {"success": True, "data": data, "method": "outermost_braces"}
        except json.JSONDecodeError as e:
            return {"success": False, "error": f"JSON parse failed: {e}", "raw": json_str}

    return {"success": False, "error": "No JSON found", "raw_response": response}


def test_full_pipeline(model, tokenizer) -> dict:
    """Test complete pipeline with robust extraction"""
    print("\n" + "="*70)
    print("FULL PIPELINE WITH ROBUST JSON EXTRACTION")
    print("="*70)

    request = "Plan a scenic motorcycle route from San Francisco to Point Reyes along the coast. I want twisty roads with ocean views and minimal highway riding."

    result = {}
    total_time = 0
    steps = []

    # Step 1: Extract locations
    print("\n[Step 1] Extracting origin and destination...")
    prompt = FINAL_PROMPTS["extract_locations"].format(user_request=request)
    resp = run_inference(model, tokenizer, prompt, 128)
    total_time += resp["duration"]

    json_data = extract_json_robust(resp.get("response", ""))
    if json_data["success"]:
        result.update(json_data["data"])
        print(f"  ✓ Extracted using: {json_data['method']}")
        print(f"    Origin: {result['origin']}")
        print(f"    Destination: {result['destination']}")
        steps.append({"step": "locations", "success": True, "method": json_data["method"]})
    else:
        print(f"  ✗ Failed: {json_data['error']}")
        print(f"    Raw: {resp['response'][:150]}")
        steps.append({"step": "locations", "success": False, "error": json_data["error"]})
        return {"strategy": "full_pipeline", "valid": False, "steps": steps}

    # Step 2: Route preferences
    print("\n[Step 2] Determining route preferences...")
    prompt = FINAL_PROMPTS["route_preference"].format(user_request=request)
    resp = run_inference(model, tokenizer, prompt, 128)
    total_time += resp["duration"]

    json_data = extract_json_robust(resp.get("response", ""))
    if json_data["success"]:
        result.update(json_data["data"])
        print(f"  ✓ Extracted using: {json_data['method']}")
        print(f"    Preference: {result['route_preference']}")
        print(f"    Avoid highways: {result['avoid_highways']}")
        steps.append({"step": "preferences", "success": True, "method": json_data["method"]})
    else:
        print(f"  ✗ Failed: {json_data['error']}")
        steps.append({"step": "preferences", "success": False, "error": json_data["error"]})

    # Step 3: Waypoints
    print("\n[Step 3] Generating waypoints...")
    prompt = FINAL_PROMPTS["waypoints"].format(
        origin=result["origin"],
        destination=result["destination"],
        user_request=request
    )
    resp = run_inference(model, tokenizer, prompt, 256)
    total_time += resp["duration"]

    json_data = extract_json_robust(resp.get("response", ""))
    if json_data["success"]:
        waypoints = json_data["data"].get("waypoints", [])
        result["waypoints"] = waypoints
        print(f"  ✓ Extracted using: {json_data['method']}")
        print(f"    Found {len(waypoints)} waypoints:")
        for i, wp in enumerate(waypoints, 1):
            print(f"      {i}. {wp.get('name', 'Unknown')} - {wp.get('reason', 'No reason')}")
        steps.append({"step": "waypoints", "success": True, "method": json_data["method"]})
    else:
        print(f"  ✗ Failed: {json_data['error']}")
        print(f"    Raw response: {resp['response'][:300]}")
        result["waypoints"] = []
        steps.append({"step": "waypoints", "success": False, "error": json_data["error"]})

    # Evaluate result quality
    has_all_fields = all(k in result for k in ["origin", "destination", "route_preference", "avoid_highways"])
    has_real_waypoints = any(
        wp.get("name", "").lower() not in ["", "string", "place name", "name1", "name2", "example"]
        for wp in result.get("waypoints", [])
    )

    print(f"\n{'='*70}")
    print(f"PIPELINE RESULT:")
    print(f"{'='*70}")
    print(f"  All required fields: {has_all_fields}")
    print(f"  Has real waypoints: {has_real_waypoints}")
    print(f"  Total waypoints: {len(result.get('waypoints', []))}")
    print(f"  Total duration: {total_time:.2f}s")
    print(f"\nFinal JSON for Google Maps:")
    print(json.dumps(result, indent=2))

    return {
        "strategy": "full_pipeline_robust",
        "valid": has_all_fields,
        "has_real_waypoints": has_real_waypoints,
        "duration": total_time,
        "waypoint_count": len(result.get("waypoints", [])),
        "data": result,
        "steps": steps
    }


def main():
    print("="*70)
    print("FINAL TEST: Robust Local Model Pipeline")
    print("="*70)

    model_name = "microsoft/Phi-3-mini-4k-instruct"
    print(f"\nModel: {model_name}")

    model, tokenizer = load(model_name)
    print("✓ Loaded\n")

    result = test_full_pipeline(model, tokenizer)

    # Save results
    output_path = Path(".spec/research/final_pipeline_result.json")
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\n✓ Results saved: {output_path}")

    # Summary
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")
    print(f"Strategy: {result['strategy']}")
    print(f"Valid JSON: {result['valid']}")
    print(f"Real waypoints: {result['has_real_waypoints']}")
    print(f"Waypoints found: {result['waypoint_count']}")
    print(f"Duration: {result['duration']:.2f}s")


if __name__ == "__main__":
    main()
