"""BDR GPX verification script - confirms HTTP accessibility, GPX parsing, and segmentation feasibility.

This script validates that:
1. BDR GPX files are accessible via HTTP from ridebdr.com
2. Downloaded files parse as valid GPX with track points
3. Routes can be segmented into 5-50 mile chunks

Usage:
    python verify_bdr.py

Output:
    Writes verification_report.json with PASS/FAIL status and check results.
"""

import json
import sys
import time
from pathlib import Path
from typing import Optional

import requests


# Constants
USER_AGENT = "LaneShadow-Pipeline/0.1 (contact: pipeline@laneshadow.app)"
RATE_LIMIT_SLEEP = 3.0
REQUEST_TIMEOUT = 30


def probe_url(url: str) -> tuple[int, Optional[bytes]]:
    """Probe a URL with proper rate limiting and User-Agent.

    Args:
        url: The URL to probe

    Returns:
        Tuple of (status_code, content) where content is None if status != 200
    """
    response = requests.get(
        url,
        headers={"User-Agent": USER_AGENT},
        timeout=REQUEST_TIMEOUT,
    )
    time.sleep(RATE_LIMIT_SLEEP)

    if response.status_code == 200:
        return response.status_code, response.content
    return response.status_code, None


def parse_gpx(content: bytes):
    """Parse GPX content bytes into a GPX object.

    Args:
        content: GPX file content as bytes

    Returns:
        gpxpy.gpx.GPX object

    Raises:
        Exception: If content is not valid GPX
    """
    import gpxpy

    return gpxpy.parse(content.decode("utf-8"))


def segment_track(gpx, min_mi: float = 5.0, max_mi: float = 50.0) -> list[dict]:
    """Segment a GPX track into chunks of specified distance range.

    Uses Haversine distance to accumulate point-to-point distances.

    Args:
        gpx: Parsed GPX object
        min_mi: Minimum segment distance in miles (default 5.0)
        max_mi: Maximum segment distance in miles (default 50.0)

    Returns:
        List of segment dicts with 'distance_miles' and 'point_count' keys
    """
    from haversine import haversine, Unit

    segments = []
    current_points = []
    current_distance = 0.0

    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                current_points.append(point)

                if len(current_points) > 1:
                    # Calculate distance from previous point
                    prev_point = current_points[-2]
                    curr_point = current_points[-1]
                    segment_distance = haversine(
                        (prev_point.latitude, prev_point.longitude),
                        (curr_point.latitude, curr_point.longitude),
                        unit=Unit.MILES,
                    )
                    current_distance += segment_distance

                # Check if we've reached the minimum segment length
                if current_distance >= min_mi:
                    segments.append({
                        "distance_miles": current_distance,
                        "point_count": len(current_points),
                    })
                    # Start a new segment
                    current_points = [point]
                    current_distance = 0.0

    return segments


def verify_all(urls_file: str, report_file: str) -> dict:
    """Run all verification checks and write report.

    Args:
        urls_file: Path to JSON file containing list of BDR URLs
        report_file: Path where verification report will be written

    Returns:
        Verification report dict
    """
    # Load known URLs
    with open(urls_file) as f:
        urls = json.load(f)

    # Initialize report
    report = {
        "status": "FAIL",
        "checks": {
            "http_accessible": False,
            "gpx_parseable": False,
            "segmentation_feasible": False,
        },
        "track_point_count": 0,
        "segment_count": 0,
        "errors": [],
    }

    # AC-1: HTTP Accessibility
    print(f"Checking HTTP accessibility for {len(urls)} URLs...")
    all_accessible = True
    for url in urls:
        print(f"  Probing: {url}")
        status, content = probe_url(url)
        if status != 200 or content is None:
            all_accessible = False
            report["errors"].append(f"HTTP {status} for {url}")
            print(f"    ✗ HTTP {status}")
        else:
            print(f"    ✓ HTTP 200 ({len(content)} bytes)")

    report["checks"]["http_accessible"] = all_accessible
    if not all_accessible:
        _write_report(report, report_file)
        return report

    # AC-2: GPX Parsing (use first successfully downloaded GPX)
    print("\nParsing GPX content...")
    try:
        _, gpx_content = probe_url(urls[0])
        gpx = parse_gpx(gpx_content)

        # Count track points
        track_point_count = sum(
            len(seg.points)
            for track in gpx.tracks
            for seg in track.segments
        )

        report["track_point_count"] = track_point_count
        report["checks"]["gpx_parseable"] = track_point_count > 0
        print(f"  ✓ Parsed {track_point_count} track points")

    except Exception as e:
        report["errors"].append(f"GPX parsing failed: {e}")
        report["checks"]["gpx_parseable"] = False
        _write_report(report, report_file)
        return report

    # AC-3: Segmentation Feasibility
    print("\nTesting segmentation feasibility...")
    try:
        segments = segment_track(gpx, min_mi=5.0, max_mi=50.0)
        report["segment_count"] = len(segments)

        # Check all segments are within bounds
        all_in_bounds = all(
            5.0 <= seg["distance_miles"] <= 50.0
            for seg in segments
        )

        report["checks"]["segmentation_feasible"] = len(segments) >= 2 and all_in_bounds
        print(f"  Generated {len(segments)} segments")

        if segments:
            distances = [seg["distance_miles"] for seg in segments]
            print(f"  Distance range: {min(distances):.1f} - {max(distances):.1f} miles")

    except Exception as e:
        report["errors"].append(f"Segmentation failed: {e}")
        report["checks"]["segmentation_feasible"] = False
        _write_report(report, report_file)
        return report

    # AC-4: Overall Status
    all_pass = all(report["checks"].values())
    report["status"] = "PASS" if all_pass else "FAIL"

    _write_report(report, report_file)
    return report


def _write_report(report: dict, report_file: str) -> None:
    """Write verification report to file."""
    report_path = Path(report_file)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\nReport written to: {report_path}")
    print(f"Overall status: {report['status']}")


def main():
    """Main entry point for command-line execution."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Verify BDR GPX accessibility, parsing, and segmentation feasibility"
    )
    parser.add_argument(
        "--urls",
        default="scripts/curation/pipeline/sources/bdr_pilot/known_urls.json",
        help="Path to JSON file containing BDR GPX URLs",
    )
    parser.add_argument(
        "--report",
        default="scripts/curation/pipeline/sources/bdr_pilot/verification_report.json",
        help="Path where verification report will be written",
    )

    args = parser.parse_args()

    report = verify_all(args.urls, args.report)

    # Exit with appropriate code
    sys.exit(0 if report["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
