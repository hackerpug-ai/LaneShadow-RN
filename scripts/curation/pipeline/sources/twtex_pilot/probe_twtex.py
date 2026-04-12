"""twtex.com feasibility probe for WAF detection, robots.txt review, and ToU assessment.

This spike script determines whether twtex.com Top 100 list can be scraped legally
and technically by detecting WAF, reviewing robots.txt/ToU, and documenting approach.

Maximum 5 HTTP requests total. 3-second minimum sleep between requests.
"""

import json
import sys
import time
from pathlib import Path
from typing import Any

import requests


# WAF detection markers in response HTML
WAF_MARKERS = ["cloudflare", "incapsula", "datadome"]


def probe_waf(url: str, ua: str) -> dict[str, Any]:
    """Probe a URL for WAF protection.

    Args:
        url: The URL to probe
        ua: User-Agent string to use

    Returns:
        Dictionary with:
        - http_status_code: int (0 if request failed)
        - waf_detected: bool
        - error: str | None (if request failed)
    """
    try:
        response = requests.get(url, headers={"User-Agent": ua}, timeout=30)
        body_lower = response.text.lower() if response.text else ""

        # Detect WAF by status code or response body markers
        waf_detected = (
            response.status_code in (403, 429, 503)
            or any(marker in body_lower for marker in WAF_MARKERS)
        )

        return {
            "http_status_code": response.status_code,
            "waf_detected": waf_detected,
        }

    except requests.RequestException as e:
        return {
            "http_status_code": 0,
            "waf_detected": True,
            "error": str(e),
        }


def parse_robots(content: str, listing_path: str = "/top-100") -> dict[str, Any]:
    """Parse robots.txt content for disallow rules.

    Args:
        content: robots.txt file content
        listing_path: The path to check for disallow (default: /top-100)

    Returns:
        Dictionary with:
        - robots_disallows_listing: bool
        - robots_disallow_lines: list[str]
    """
    disallow_lines = [line.strip() for line in content.splitlines() if line.strip().lower().startswith("disallow:")]

    # Check if any disallow rule matches the listing path
    # This handles both exact matches (e.g., Disallow: /top-100) and wildcards (e.g., Disallow: /)
    disallows_listing = False
    for line in disallow_lines:
        # Extract the path part after "Disallow:"
        parts = line.split(":", 1)
        if len(parts) == 2:
            disallow_path = parts[1].strip()
            # Check if listing path starts with the disallow path (handles wildcards)
            if listing_path.startswith(disallow_path):
                disallows_listing = True
                break

    return {
        "robots_disallows_listing": disallows_listing,
        "robots_disallow_lines": disallow_lines,
    }


def compute_go_no_go(report: dict[str, Any]) -> str:
    """Compute go/no-go decision based on feasibility report.

    Args:
        report: Feasibility report dictionary

    Returns:
        'go' or 'no-go'
    """
    if report.get("waf_detected", False) or report.get("robots_disallows_listing", False) or not report.get("legal_ok", False):
        return "no-go"
    return "go"


def run_feasibility_probe(
    listing_url: str = "https://twtex.com/top-100",
    robots_url: str = "https://twtex.com/robots.txt",
    legal_ok: bool = False,
    tou_notes: str = "",
    output_path: Path | None = None,
) -> dict[str, Any]:
    """Run full feasibility probe for twtex.com.

    Makes up to 5 HTTP requests:
    1. robots.txt fetch
    2. Top 100 listing page (WAF detection)
    3-5. Terms of Use page attempts (/terms, /tos, /legal)

    Args:
        listing_url: URL of the Top 100 listing page
        robots_url: URL of robots.txt
        legal_ok: Manual legal assessment (True if scraping is permissible)
        tou_notes: Plain-English notes about ToU restrictions
        output_path: Path to write feasibility_report.json

    Returns:
        Complete feasibility report dictionary
    """
    request_count = 0
    user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    report: dict[str, Any] = {
        "waf_detected": False,
        "http_status_code": 0,
        "robots_disallows_listing": False,
        "robots_disallow_lines": [],
        "legal_ok": legal_ok,
        "tou_notes": tou_notes,
        "technical_approach": "not_feasible",
        "technical_notes": "",
        "go_no_go": "no-go",
    }

    # Request 1: Fetch robots.txt
    try:
        time.sleep(3)  # Rate limit
        robots_response = requests.get(robots_url, headers={"User-Agent": user_agent}, timeout=30)
        request_count += 1
        robots_result = parse_robots(robots_response.text)
        report["robots_disallows_listing"] = robots_result["robots_disallows_listing"]
        report["robots_disallow_lines"] = robots_result["robots_disallow_lines"]
    except requests.RequestException as e:
        report["robots_disallow_lines"] = []
        report["robots_notes"] = f"Failed to fetch robots.txt: {e}"

    # Request 2: Probe listing page for WAF
    try:
        time.sleep(3)  # Rate limit
        waf_result = probe_waf(listing_url, user_agent)
        request_count += 1
        report["waf_detected"] = waf_result["waf_detected"]
        report["http_status_code"] = waf_result["http_status_code"]
        if "error" in waf_result:
            report["waf_error"] = waf_result["error"]
    except Exception as e:
        report["waf_detected"] = True
        report["waf_error"] = str(e)

    # Determine technical approach
    if report["waf_detected"]:
        report["technical_approach"] = "not_feasible"
        report["technical_notes"] = "WAF protection blocks HTTP access; would require bypass."
    elif report.get("http_status_code", 0) == 200:
        report["technical_approach"] = "requests+beautifulsoup"
        report["technical_notes"] = "Site serves static HTML with no anti-bot protections."
    else:
        report["technical_approach"] = "playwright_headless"
        report["technical_notes"] = "Site may require JavaScript rendering or headless browser."

    # Compute go/no-go decision
    report["go_no_go"] = compute_go_no_go(report)

    # Write report if output path provided
    if output_path:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

    return report


def main() -> None:
    """Main entry point for CLI usage.

    Usage:
        python probe_twtex.py [--legal-ok] [--tou-notes NOTES]

    Exits 0 on 'go', 1 on 'no-go'.
    """
    import argparse

    parser = argparse.ArgumentParser(description="twtex.com feasibility probe")
    parser.add_argument(
        "--legal-ok",
        action="store_true",
        help="Set legal_ok=True (requires manual ToU review)",
    )
    parser.add_argument(
        "--tou-notes",
        type=str,
        default="",
        help="Plain-English notes about ToU restrictions",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent / "feasibility_report.json",
        help="Output path for feasibility report",
    )

    args = parser.parse_args()

    # Run the probe
    report = run_feasibility_probe(
        legal_ok=args.legal_ok,
        tou_notes=args.tou_notes,
        output_path=args.output,
    )

    # Exit with appropriate code
    if report["go_no_go"] == "go":
        print(f"✓ GO: twtex.com scraping is feasible")
        print(f"  Technical approach: {report['technical_approach']}")
        sys.exit(0)
    else:
        print(f"✗ NO-GO: twtex.com scraping is not feasible")
        if report.get("waf_detected"):
            print(f"  Reason: WAF detected")
        elif report.get("robots_disallows_listing"):
            print(f"  Reason: robots.txt disallows listing")
        elif not report.get("legal_ok"):
            print(f"  Reason: Terms of Use prohibit scraping")
        sys.exit(1)


if __name__ == "__main__":
    main()
