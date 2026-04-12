# BDR GPX Verification Research Task

**Source:** Backcountry Discovery Routes (BDR)
**URL:** https://ridebdr.com/
**Task ID:** UC-SRC-02-VERIFY
**Timeline:** Day 1 of Week 0 (1-2 hours)
**Status:** Pending

---

## Objective

Verify the availability, accessibility, and technical feasibility of acquiring GPX route data from ridebdr.com for the LaneShadow curation system.

**Expected Deliverable:** 10 multi-day BDR routes in GPX format, suitable for import into the local SQLite database.

---

## Verification Checklist

### Accessibility
- [ ] Site exists and loads without errors
- [ ] Site is accessible from US IP addresses
- [ ] No geographic restrictions detected
- [ ] SSL certificate is valid

### Authentication
- [ ] GPX files are publicly available (no login required)
- [ ] If login required: determine if free or paid tier
- [ ] Document any API key requirements
- [ ] Check for rate limiting policies

### Data Format
- [ ] GPX files are downloadable (not embedded in maps)
- [ ] GPX format is consistent across all routes
- [ ] GPX schema version identified (1.0 vs 1.1)
- [ ] Files contain waypoints (points of interest)
- [ ] Files contain tracks (actual ride path)
- [ ] Files contain route metadata (name, description, difficulty)
- [ ] File sizes are reasonable (<5MB per route)

### Coverage
- [ ] All 10 BDR routes are accessible:
  1. Alaska BDR
  2. Appalachian BDR
  3. Baja BDR
  4. California BDR
  5. Colorado BDR
  6. Idaho BDR
  7. Midwest BDR
  8. Nevada BDR
  9. Oregon BDR
  10. Washington BDR

### Technical Feasibility
- [ ] No JavaScript-heavy download mechanisms
- [ ] No anti-scraping measures (Cloudflare, etc.)
- [ ] Stable URL structure for route downloads
- [ ] No session tokens required for downloads

---

## Live Test Script

```python
"""
BDR GPX Verification Script
Tests accessibility, format consistency, and technical feasibility
"""

import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Optional
import json

BDR_BASE_URL = "https://ridebdr.com/"
EXPECTED_ROUTES = [
    "Alaska BDR",
    "Appalachian BDR",
    "Baja BDR",
    "California BDR",
    "Colorado BDR",
    "Idaho BDR",
    "Midwest BDR",
    "Nevada BDR",
    "Oregon BDR",
    "Washington BDR"
]

def test_site_accessibility() -> Dict[str, any]:
    """Test if site is accessible and document response."""
    print(f"Testing accessibility: {BDR_BASE_URL}")
    
    try:
        response = requests.get(BDR_BASE_URL, timeout=10)
        return {
            "accessible": response.status_code == 200,
            "status_code": response.status_code,
            "response_time": response.elapsed.total_seconds(),
            "content_type": response.headers.get("content-type"),
            "server": response.headers.get("server"),
            "ssl": response.url.startswith("https")
        }
    except Exception as e:
        return {
            "accessible": False,
            "error": str(e)
        }

def find_gpx_download_links() -> List[Dict[str, str]]:
    """Scrape site for GPX download links."""
    print("Searching for GPX download links...")
    
    try:
        response = requests.get(BDR_BASE_URL, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for common GPX link patterns
        gpx_links = []
        
        # Direct .gpx links
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '.gpx' in href.lower():
                gpx_links.append({
                    "url": href if href.startswith('http') else BDR_BASE_URL + href,
                    "text": link.get_text(strip=True),
                    "type": "direct"
                })
        
        # Download buttons with data attributes
        for button in soup.find_all(['button', 'div'], {'data-url': True}):
            url = button['data-url']
            if '.gpx' in url.lower():
                gpx_links.append({
                    "url": url,
                    "text": button.get_text(strip=True),
                    "type": "button_data_attr"
                })
        
        return gpx_links
        
    except Exception as e:
        print(f"Error finding GPX links: {e}")
        return []

def test_gpx_download(url: str) -> Dict[str, any]:
    """Test downloading a GPX file and analyze its contents."""
    print(f"Testing GPX download: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        
        if response.status_code != 200:
            return {
                "downloadable": False,
                "status_code": response.status_code,
                "error": f"HTTP {response.status_code}"
            }
        
        content = response.content
        file_size = len(content) / (1024 * 1024)  # MB
        
        # Parse GPX content
        gpx_text = content.decode('utf-8', errors='ignore')
        
        # Check for GPX elements
        has_waypoints = '<wpt' in gpx_text
        has_tracks = '<trk' in gpx_text
        has_routes = '<rte' in gpx_text
        has_metadata = '<metadata' in gpx_text or '<name' in gpx_text
        
        # Identify schema version
        version = "unknown"
        if 'version="1.1"' in gpx_text:
            version = "1.1"
        elif 'version="1.0"' in gpx_text:
            version = "1.0"
        
        return {
            "downloadable": True,
            "file_size_mb": round(file_size, 2),
            "schema_version": version,
            "has_waypoints": has_waypoints,
            "has_tracks": has_tracks,
            "has_routes": has_routes,
            "has_metadata": has_metadata,
            "content_preview": gpx_text[:500]
        }
        
    except Exception as e:
        return {
            "downloadable": False,
            "error": str(e)
        }

def check_authentication_required(url: str) -> Dict[str, any]:
    """Test if authentication is required for downloads."""
    print(f"Checking authentication requirements: {url}")
    
    try:
        # Try without auth
        response = requests.get(url, timeout=10)
        
        if response.status_code == 401:
            return {"auth_required": True, "type": "unauthorized"}
        elif response.status_code == 403:
            return {"auth_required": True, "type": "forbidden"}
        elif 'login' in response.url.lower():
            return {"auth_required": True, "type": "redirect_to_login"}
        elif response.status_code == 200:
            return {"auth_required": False, "type": "public"}
        else:
            return {"auth_required": "unknown", "status": response.status_code}
            
    except Exception as e:
        return {"auth_required": "error", "error": str(e)}

def check_rate_limiting() -> Dict[str, any]:
    """Test for rate limiting."""
    print("Testing for rate limiting...")
    
    requests_made = []
    for i in range(5):
        start = time.time()
        response = requests.get(BDR_BASE_URL, timeout=10)
        elapsed = time.time() - start
        requests_made.append({
            "request": i + 1,
            "status": response.status_code,
            "time": elapsed,
            "retry_after": response.headers.get("Retry-After"),
            "rate_limit_remaining": response.headers.get("X-RateLimit-Remaining"),
            "rate_limit_reset": response.headers.get("X-RateLimit-Reset")
        })
        time.sleep(0.5)  # Small delay between requests
    
    # Detect rate limiting
    rate_limited = any(
        r["status"] == 429 or
        r["retry_after"] is not None or
        r["rate_limit_remaining"] is not None
        for r in requests_made
    )
    
    return {
        "rate_limited": rate_limited,
        "requests": requests_made
    }

def main():
    """Run all verification tests."""
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "source": "BDR",
        "url": BDR_BASE_URL
    }
    
    # Test 1: Accessibility
    print("\n" + "="*50)
    print("TEST 1: Site Accessibility")
    print("="*50)
    results["accessibility"] = test_site_accessibility()
    
    if not results["accessibility"]["accessible"]:
        print("\n❌ Site not accessible. Stopping verification.")
        print(json.dumps(results, indent=2))
        return
    
    print(f"✅ Site accessible (HTTP {results['accessibility']['status_code']})")
    
    # Test 2: Find GPX links
    print("\n" + "="*50)
    print("TEST 2: GPX Link Discovery")
    print("="*50)
    gpx_links = find_gpx_download_links()
    results["gpx_links_found"] = len(gpx_links)
    results["gpx_links"] = gpx_links[:10]  # First 10
    
    if not gpx_links:
        print("⚠️ No GPX links found. Manual investigation needed.")
        print("Check if:")
        print("  - Downloads require account creation")
        print("  - GPX files are behind a paywall")
        print("  - Download links are loaded via JavaScript")
    else:
        print(f"✅ Found {len(gpx_links)} GPX links")
    
    # Test 3: Test sample downloads (max 3)
    print("\n" + "="*50)
    print("TEST 3: Sample GPX Downloads")
    print("="*50)
    
    sample_links = gpx_links[:3] if len(gpx_links) >= 3 else gpx_links
    download_results = []
    
    for link in sample_links:
        result = test_gpx_download(link["url"])
        result["source_url"] = link["url"]
        download_results.append(result)
        
        if result["downloadable"]:
            print(f"✅ {link['url']}")
            print(f"   Size: {result['file_size_mb']} MB")
            print(f"   Schema: {result['schema_version']}")
            print(f"   Waypoints: {result['has_waypoints']}, Tracks: {result['has_tracks']}")
        else:
            print(f"❌ {link['url']}: {result.get('error', 'Unknown error')}")
    
    results["sample_downloads"] = download_results
    
    # Test 4: Authentication check
    print("\n" + "="*50)
    print("TEST 4: Authentication Requirements")
    print("="*50)
    
    if gpx_links:
        auth_check = check_authentication_required(gpx_links[0]["url"])
        results["authentication"] = auth_check
        
        if auth_check["auth_required"]:
            print(f"⚠️ Authentication required: {auth_check['type']}")
        else:
            print("✅ GPX files are publicly accessible")
    
    # Test 5: Rate limiting
    print("\n" + "="*50)
    print("TEST 5: Rate Limiting Detection")
    print("="*50)
    rate_limit = check_rate_limiting()
    results["rate_limiting"] = rate_limit
    
    if rate_limit["rate_limited"]:
        print("⚠️ Rate limiting detected")
    else:
        print("✅ No rate limiting detected")
    
    # Final report
    print("\n" + "="*50)
    print("VERIFICATION SUMMARY")
    print("="*50)
    print(json.dumps(results, indent=2))
    
    # Save results
    with open("bdr-verification-results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("\n✅ Verification complete. Results saved to bdr-verification-results.json")

if __name__ == "__main__":
    main()
```

---

## Decision Criteria

| Verification Result | Action | Notes |
|---------------------|--------|-------|
| ✅ Public GPX, no auth required | **PROCEED** with UC-SRC-02 implementation | Ideal scenario |
| ⚠️ Free account required | **PROCEED** with API key integration | Add auth layer to data source |
| ❌ Paid subscription only | **DEFER** to Phase 2 | Add to backlog, prioritize other sources |
| ❌ No GPX available | **DROP** source | Remove from research tracker |
| ⚠️ Inconsistent format | **PROCEED** with normalization | Add GPX normalization layer |
| ❌ Heavy rate limiting | **DEFER** or use official API | May impact user experience |
| ⚠️ JavaScript-only downloads | **INVESTIGATE** manual alternatives | May require Selenium/Puppeteer |

---

## Expected Outcomes

### Success Scenario
- All 10 BDR routes accessible
- GPX files publicly downloadable
- Consistent GPX 1.1 schema
- File sizes <5MB per route
- No authentication required

### Proceed with Caution
- Free account required for downloads
- Slight format variations between routes
- Rate limiting present but reasonable

### Blocker Scenario
- Paid subscription required
- No GPX downloads available
- Technical anti-scraping measures

---

## Next Steps

### If Verification Succeeds
1. Create UC-SRC-02 implementation task
2. Design BDR data source schema
3. Implement GPX parser for BDR format
4. Add BDR to curation ingestion pipeline

### If Verification Fails
1. Document specific blocker in research tracker
2. Identify alternative sources for dual-sport routes
3. Update DATASETS.md with BDR status

### If Verification Returns Mixed Results
1. Document constraints (e.g., "Free account required")
2. Estimate implementation complexity
3. Present findings to team for go/no-go decision

---

## Research Notes

*Add findings during verification:*

- **Date:** [Fill in during verification]
- **Tester:** [Fill in during verification]
- **Routes found:** [Fill in during verification]
- **GPX format version:** [Fill in during verification]
- **Authentication method:** [Fill in during verification]
- **Rate limits:** [Fill in during verification]
- **Special considerations:** [Fill in during verification]
