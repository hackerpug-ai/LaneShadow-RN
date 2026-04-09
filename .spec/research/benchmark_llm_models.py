#!/usr/bin/env python3
"""
LLM Model Benchmark for Motorcycle Route Suggestion
Tests multiple models on motorcycle route prompts and measures performance
Compares local models against Claude Haiku API as baseline
"""

import json
import time
import psutil
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import subprocess

try:
    from mlx_lm import load, generate
except ImportError:
    print("MLX not found. Installing...")
    subprocess.check_call(["pip3", "install", "mlx-lm"])
    from mlx_lm import load, generate

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    print("Warning: anthropic package not found. Haiku baseline will be skipped.")


# Motorcycle route-specific test prompts with JSON output requirement
ROUTE_PROMPTS = [
    {
        "name": "Scenic Coastal Run",
        "prompt": """You are a motorcycle route planning assistant. Respond ONLY with valid JSON matching this schema:
{
  "route_name": "string",
  "origin": {"address": "string", "lat": number, "lng": number},
  "destination": {"address": "string", "lat": number, "lng": number},
  "waypoints": [{"address": "string", "lat": number, "lng": number}],
  "route_preference": "scenic|twisty|direct|sporty",
  "distance_estimate_miles": number,
  "duration_hours": number,
  "road_quality": "excellent|good|fair|poor",
  "traffic_expectation": "light|moderate|heavy",
  "avoid_highways": boolean,
  "scenic_highlights": ["string"]
}

User request: Plan a scenic motorcycle route from San Francisco to Point Reyes along the coast. I want twisty roads with ocean views and minimal highway riding.""",
        "required_fields": ["origin", "destination", "route_preference", "avoid_highways"]
    },
    {
        "name": "Mountain Twisties",
        "prompt": """You are a motorcycle route planning assistant. Respond ONLY with valid JSON matching this schema:
{
  "route_name": "string",
  "origin": {"address": "string", "lat": number, "lng": number},
  "destination": {"address": "string", "lat": number, "lng": number},
  "waypoints": [{"address": "string", "lat": number, "lng": number}],
  "route_preference": "scenic|twisty|direct|sporty",
  "distance_estimate_miles": number,
  "duration_hours": number,
  "road_quality": "excellent|good|fair|poor",
  "traffic_expectation": "light|moderate|heavy",
  "avoid_highways": boolean,
  "scenic_highlights": ["string"]
}

User request: I want a sporty motorcycle ride from Silicon Valley to Mount Hamilton. Focus on the best twisty roads and elevation gain. Avoid straight highways.""",
        "required_fields": ["origin", "destination", "route_preference", "waypoints"]
    },
    {
        "name": "Multi-Day Trip",
        "prompt": """You are a motorcycle route planning assistant. Respond ONLY with valid JSON matching this schema:
{
  "route_name": "string",
  "origin": {"address": "string", "lat": number, "lng": number},
  "destination": {"address": "string", "lat": number, "lng": number},
  "waypoints": [{"address": "string", "lat": number, "lng": number}],
  "route_preference": "scenic|twisty|direct|sporty",
  "distance_estimate_miles": number,
  "duration_hours": number,
  "road_quality": "excellent|good|fair|poor",
  "traffic_expectation": "light|moderate|heavy",
  "avoid_highways": boolean,
  "scenic_highlights": ["string"]
}

User request: Plan a 2-day motorcycle trip from San Francisco to Yosemite National Park. Include scenic stops along the way and good overnight stopping points with motorcycle-friendly lodging.""",
        "required_fields": ["origin", "destination", "waypoints", "scenic_highlights"]
    },
    {
        "name": "Wine Country Run",
        "prompt": """You are a motorcycle route planning assistant. Respond ONLY with valid JSON matching this schema:
{
  "route_name": "string",
  "origin": {"address": "string", "lat": number, "lng": number},
  "destination": {"address": "string", "lat": number, "lng": number},
  "waypoints": [{"address": "string", "lat": number, "lng": number}],
  "route_preference": "scenic|twisty|direct|sporty",
  "distance_estimate_miles": number,
  "duration_hours": number,
  "road_quality": "excellent|good|fair|poor",
  "traffic_expectation": "light|moderate|heavy",
  "avoid_highways": boolean,
  "scenic_highlights": ["string"]
}

User request: Create a motorcycle route through Napa and Sonoma valleys. I want to visit 3-4 wineries with great roads between them. Start and end in San Francisco.""",
        "required_fields": ["origin", "destination", "waypoints", "route_preference"]
    }
]

# Local models to benchmark
LOCAL_MODELS = [
    "mlx-community/Llama-3.2-1B-Instruct-4bit",
    "mlx-community/Llama-3.2-3B-Instruct-4bit",
    "microsoft/Phi-3-mini-4k-instruct",
]


def get_model_size(model_name: str) -> Dict[str, float]:
    """Get model disk size and memory footprint"""
    model_path = Path.home() / ".cache" / "huggingface" / "hub" / f"models--{model_name.replace('/', '--')}"

    disk_size = 0
    if model_path.exists():
        disk_size = sum(f.stat().st_size for f in model_path.rglob('*') if f.is_file())

    return {
        "disk_size_mb": round(disk_size / (1024 * 1024), 2),
        "disk_size_gb": round(disk_size / (1024 * 1024 * 1024), 2)
    }


def measure_performance() -> Dict[str, float]:
    """Measure current system performance"""
    process = psutil.Process()
    memory_info = process.memory_info()

    return {
        "memory_used_mb": round(memory_info.rss / (1024 * 1024), 2),
        "cpu_percent": process.cpu_percent(),
        "thread_count": process.num_threads()
    }


def run_local_inference(model, tokenizer, prompt: str, max_tokens: int = 512) -> Dict[str, Any]:
    """Run local inference and measure performance"""
    start_time = time.time()
    start_mem = measure_performance()

    try:
        response = generate(
            model,
            tokenizer,
            prompt=prompt,
            max_tokens=max_tokens,
            verbose=False
        )

        end_time = time.time()
        end_mem = measure_performance()

        # Calculate metrics
        duration = end_time - start_time
        tokens = len(response.split())
        tokens_per_second = tokens / duration if duration > 0 else 0

        return {
            "success": True,
            "response": response,
            "duration_seconds": round(duration, 3),
            "tokens_generated": tokens,
            "tokens_per_second": round(tokens_per_second, 2),
            "memory_delta_mb": round(end_mem["memory_used_mb"] - start_mem["memory_used_mb"], 2),
            "start_memory_mb": start_mem["memory_used_mb"],
            "end_memory_mb": end_mem["memory_used_mb"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "duration_seconds": round(time.time() - start_time, 3)
        }


def run_haiku_inference(prompt: str) -> Dict[str, Any]:
    """Run Haiku API inference and measure performance"""
    if not HAS_ANTHROPIC:
        return {
            "success": False,
            "error": "anthropic package not installed"
        }

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "success": False,
            "error": "ANTHROPIC_API_KEY not set"
        }

    start_time = time.time()

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=512,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )

        end_time = time.time()
        duration = end_time - start_time

        response_text = message.content[0].text
        tokens = message.usage.output_tokens

        return {
            "success": True,
            "response": response_text,
            "duration_seconds": round(duration, 3),
            "tokens_generated": tokens,
            "tokens_per_second": round(tokens / duration, 2) if duration > 0 else 0,
            "input_tokens": message.usage.input_tokens,
            "total_tokens": message.usage.input_tokens + tokens
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "duration_seconds": round(time.time() - start_time, 3)
        }


def extract_json(response: str) -> Dict[str, Any]:
    """Attempt to extract JSON from model response"""
    # Try to find JSON block in response
    json_start = response.find('{')
    json_end = response.rfind('}')

    if json_start == -1 or json_end == -1 or json_start > json_end:
        return {"success": False, "error": "No JSON found", "raw_response": response}

    json_str = response[json_start:json_end + 1]

    try:
        parsed = json.loads(json_str)
        return {"success": True, "data": parsed, "raw_response": response}
    except json.JSONDecodeError as e:
        return {"success": False, "error": f"Invalid JSON: {e}", "raw_response": response}


def evaluate_response(response: str, required_fields: List[str]) -> Dict[str, Any]:
    """Evaluate if response contains valid JSON with required fields"""
    json_result = extract_json(response)

    if not json_result["success"]:
        return {
            "valid_json": False,
            "error": json_result.get("error", "Unknown error"),
            "found_fields": [],
            "missing_fields": required_fields,
            "completeness_ratio": 0.0
        }

    data = json_result["data"]
    found_fields = []
    missing_fields = []

    for field in required_fields:
        if field in data:
            found_fields.append(field)
        else:
            missing_fields.append(field)

    return {
        "valid_json": True,
        "found_fields": found_fields,
        "missing_fields": missing_fields,
        "parsed_data": data,
        "completeness_ratio": round(len(found_fields) / len(required_fields), 3) if required_fields else 0,
        "raw_response": response
    }


def benchmark_local_model(model_name: str) -> Dict[str, Any]:
    """Benchmark a local model on all prompts"""
    print(f"\n{'='*60}")
    print(f"Testing Local Model: {model_name}")
    print(f"{'='*60}")

    results = {
        "model_name": model_name,
        "model_type": "local",
        "timestamp": datetime.now().isoformat(),
        "model_info": {},
        "prompts": []
    }

    # Load model
    print("Loading model...")
    try:
        model, tokenizer = load(model_name)
        print("✓ Model loaded successfully")

        # Get model size info
        model_info = get_model_size(model_name)
        model_info["load_success"] = True
        results["model_info"] = model_info
        print(f"  Disk size: {model_info['disk_size_gb']} GB")

    except Exception as e:
        print(f"✗ Failed to load model: {e}")
        results["model_info"] = {
            "load_success": False,
            "error": str(e)
        }
        return results

    # Test each prompt
    for i, prompt_test in enumerate(ROUTE_PROMPTS, 1):
        print(f"\n[{i}/{len(ROUTE_PROMPTS)}] Testing: {prompt_test['name']}")

        inference_result = run_local_inference(model, tokenizer, prompt_test["prompt"])

        if inference_result["success"]:
            print(f"  ✓ Success: {inference_result['duration_seconds']}s")
            print(f"    Tokens: {inference_result['tokens_generated']} ({inference_result['tokens_per_second']} tok/s)")
            print(f"    Memory: {inference_result['start_memory_mb']} → {inference_result['end_memory_mb']} MB")

            # Evaluate response quality
            evaluation = evaluate_response(inference_result["response"], prompt_test["required_fields"])
            print(f"    Valid JSON: {evaluation['valid_json']}")
            print(f"    Completeness: {evaluation['completeness_ratio']:.1%} ({evaluation['found_fields']}/{prompt_test['required_fields']})")

            inference_result["evaluation"] = evaluation
            inference_result["response_preview"] = inference_result["response"][:300] + "..." if len(inference_result["response"]) > 300 else inference_result["response"]
        else:
            print(f"  ✗ Failed: {inference_result.get('error', 'Unknown error')}")

        prompt_result = {
            "prompt_name": prompt_test["name"],
            "prompt": prompt_test["prompt"],
            "required_fields": prompt_test["required_fields"],
            **inference_result
        }

        results["prompts"].append(prompt_result)

    # Calculate aggregate stats
    successful_prompts = [p for p in results["prompts"] if p.get("success", False)]

    if successful_prompts:
        results["aggregate_stats"] = {
            "total_prompts": len(ROUTE_PROMPTS),
            "successful_prompts": len(successful_prompts),
            "success_rate": round(len(successful_prompts) / len(ROUTE_PROMPTS), 3),
            "avg_duration_seconds": round(sum(p["duration_seconds"] for p in successful_prompts) / len(successful_prompts), 3),
            "avg_tokens_per_second": round(sum(p["tokens_per_second"] for p in successful_prompts) / len(successful_prompts), 2),
            "avg_completeness": round(sum(p["evaluation"]["completeness_ratio"] for p in successful_prompts) / len(successful_prompts), 3),
            "valid_json_rate": round(sum(1 for p in successful_prompts if p["evaluation"]["valid_json"]) / len(successful_prompts), 3),
            "avg_memory_used_mb": round(sum(p["start_memory_mb"] for p in successful_prompts) / len(successful_prompts), 2)
        }

    return results


def benchmark_haiku() -> Dict[str, Any]:
    """Benchmark Haiku API on all prompts"""
    print(f"\n{'='*60}")
    print(f"Testing Baseline: Claude Haiku (API)")
    print(f"{'='*60}")

    results = {
        "model_name": "claude-3-5-haiku-20241022",
        "model_type": "api",
        "timestamp": datetime.now().isoformat(),
        "model_info": {
            "provider": "Anthropic",
            "api_endpoint": "https://api.anthropic.com",
            "load_success": True
        },
        "prompts": []
    }

    if not HAS_ANTHROPIC:
        print("✗ Anthropic package not installed")
        results["model_info"]["load_success"] = False
        results["model_info"]["error"] = "anthropic package not installed"
        return results

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("✗ ANTHROPIC_API_KEY not set")
        results["model_info"]["load_success"] = False
        results["model_info"]["error"] = "ANTHROPIC_API_KEY not set"
        return results

    print("✓ API client configured")

    # Test each prompt
    for i, prompt_test in enumerate(ROUTE_PROMPTS, 1):
        print(f"\n[{i}/{len(ROUTE_PROMPTS)}] Testing: {prompt_test['name']}")

        inference_result = run_haiku_inference(prompt_test["prompt"])

        if inference_result["success"]:
            print(f"  ✓ Success: {inference_result['duration_seconds']}s")
            print(f"    Tokens: {inference_result['tokens_generated']} ({inference_result['tokens_per_second']} tok/s)")
            print(f"    Input tokens: {inference_result['input_tokens']}")

            # Evaluate response quality
            evaluation = evaluate_response(inference_result["response"], prompt_test["required_fields"])
            print(f"    Valid JSON: {evaluation['valid_json']}")
            print(f"    Completeness: {evaluation['completeness_ratio']:.1%} ({evaluation['found_fields']}/{prompt_test['required_fields']})")

            inference_result["evaluation"] = evaluation
            inference_result["response_preview"] = inference_result["response"][:300] + "..." if len(inference_result["response"]) > 300 else inference_result["response"]
        else:
            print(f"  ✗ Failed: {inference_result.get('error', 'Unknown error')}")

        prompt_result = {
            "prompt_name": prompt_test["name"],
            "prompt": prompt_test["prompt"],
            "required_fields": prompt_test["required_fields"],
            **inference_result
        }

        results["prompts"].append(prompt_result)

    # Calculate aggregate stats
    successful_prompts = [p for p in results["prompts"] if p.get("success", False)]

    if successful_prompts:
        results["aggregate_stats"] = {
            "total_prompts": len(ROUTE_PROMPTS),
            "successful_prompts": len(successful_prompts),
            "success_rate": round(len(successful_prompts) / len(ROUTE_PROMPTS), 3),
            "avg_duration_seconds": round(sum(p["duration_seconds"] for p in successful_prompts) / len(successful_prompts), 3),
            "avg_tokens_per_second": round(sum(p["tokens_per_second"] for p in successful_prompts) / len(successful_prompts), 2),
            "avg_completeness": round(sum(p["evaluation"]["completeness_ratio"] for p in successful_prompts) / len(successful_prompts), 3),
            "valid_json_rate": round(sum(1 for p in successful_prompts if p["evaluation"]["valid_json"]) / len(successful_prompts), 3),
            "avg_input_tokens": round(sum(p.get("input_tokens", 0) for p in successful_prompts) / len(successful_prompts), 2)
        }

    return results


def save_results(all_results: List[Dict[str, Any]], output_path: str):
    """Save benchmark results to JSON file"""
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w') as f:
        json.dump({
            "benchmark_timestamp": datetime.now().isoformat(),
            "benchmark_type": "motorcycle_route_structured_json",
            "system_info": {
                "platform": os.uname().machine,
                "processor": os.uname().machine,
                "memory_gb": round(psutil.virtual_memory().total / (1024**3), 2)
            },
            "results": all_results
        }, f, indent=2)

    print(f"\n✓ Results saved to: {output_file}")


def main():
    """Main benchmark execution"""
    print("="*60)
    print("LLM Motorcycle Route Benchmark (vs Haiku Baseline)")
    print("="*60)
    print(f"Local models: {len(LOCAL_MODELS)}")
    print(f"Prompts per model: {len(ROUTE_PROMPTS)}")
    print(f"Output: .spec/research/llm_benchmark_results.json")
    print("="*60)

    all_results = []

    # Benchmark local models
    for model_name in LOCAL_MODELS:
        try:
            result = benchmark_local_model(model_name)
            all_results.append(result)
        except Exception as e:
            print(f"\n✗ Fatal error testing {model_name}: {e}")
            all_results.append({
                "model_name": model_name,
                "model_type": "local",
                "error": str(e),
                "success": False
            })

    # Benchmark Haiku API
    try:
        haiku_result = benchmark_haiku()
        all_results.append(haiku_result)
    except Exception as e:
        print(f"\n✗ Fatal error testing Haiku: {e}")
        all_results.append({
            "model_name": "claude-3-5-haiku-20241022",
            "model_type": "api",
            "error": str(e),
            "success": False
        })

    # Save results
    save_results(all_results, ".spec/research/llm_benchmark_results.json")

    # Print summary
    print("\n" + "="*60)
    print("BENCHMARK SUMMARY")
    print("="*60)

    for result in all_results:
        if "aggregate_stats" in result:
            stats = result["aggregate_stats"]
            model_type = result.get("model_type", "unknown").upper()
            print(f"\n{result['model_name']} ({model_type}):")
            print(f"  Success Rate: {stats['success_rate']:.1%}")
            print(f"  Valid JSON Rate: {stats['valid_json_rate']:.1%}")
            print(f"  Avg Speed: {stats['avg_tokens_per_second']} tok/s")
            print(f"  Avg Duration: {stats['avg_duration_seconds']}s")
            print(f"  Avg Completeness: {stats['avg_completeness']:.1%}")
            if result.get("model_info", {}).get("disk_size_gb"):
                print(f"  Disk Size: {result['model_info']['disk_size_gb']} GB")
        else:
            print(f"\n{result['model_name']}: FAILED")

    print("\n" + "="*60)


if __name__ == "__main__":
    main()
