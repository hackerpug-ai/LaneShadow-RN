#!/usr/bin/env python3
"""
Quick analysis of Qwen3.5 benchmark results
"""
import json

# Load results
with open('/Users/justinrich/Projects/LaneShadow/.spec/research/.spec/research/llm_benchmark_results_2026.json', 'r') as f:
    data = json.load(f)

print("="*60)
print("QWEN3.5 BENCHMARK RESULTS ANALYSIS")
print("="*60)

for result in data['results']:
    if 'Qwen' in result['model_name']:
        print(f"\n{result['model_name']}:")
        print(f"  Disk Size: {result['model_info']['disk_size_gb']} GB")
        print(f"  Speed: {result['aggregate_stats']['avg_tokens_per_second']:.1f} tok/s")
        print(f"  Duration: {result['aggregate_stats']['avg_duration_seconds']:.1f}s")

        # Check first response manually
        first_prompt = result['prompts'][0]
        response = first_prompt['response']

        print(f"\n  First Response Preview:")
        print(f"  {response[:200]}...")

        # Try to extract JSON better
        import re
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                print(f"\n  ✓ JSON found and valid!")
                print(f"  Keys: {list(parsed.keys())}")
                if 'waypoints' in parsed:
                    print(f"  Waypoints: {len(parsed['waypoints'])} found")
            except:
                print(f"\n  ✗ JSON found but invalid")

print("\n" + "="*60)
print("COMPARISON: Qwen3.5 0.8B vs 2025 Models")
print("="*60)

for result in data['results']:
    if result['model_name'] == 'mlx-community/Qwen3.5-0.8B-OptiQ-4bit':
        qwen_stats = result['aggregate_stats']
        print(f"\nQwen3.5 0.8B (2026):")
        print(f"  Speed: {qwen_stats['avg_tokens_per_second']:.1f} tok/s")
        print(f"  Duration: {qwen_stats['avg_duration_seconds']:.1f}s")
        print(f"  Memory: {result['model_info']['disk_size_gb']} GB")
        break

for result in data['results']:
    if result['model_name'] == 'mlx-community/Llama-3.2-1B-Instruct-4bit':
        llama_stats = result['aggregate_stats']
        print(f"\nLlama 3.2 1B (2025 baseline):")
        print(f"  Speed: {llama_stats['avg_tokens_per_second']:.1f} tok/s")
        print(f"  Duration: {llama_stats['avg_duration_seconds']:.1f}s")
        print(f"  Memory: {result['model_info']['disk_size_gb']} GB")
        break

print("\n" + "="*60)
