# TWTex.com Research Task

## Objective

Verify twtex.com Top 100 list accessibility and assess scraping feasibility for the LaneShadow motorcycle route discovery feature.

## Target Information

| Field | Value |
|-------|-------|
| **Source Name** | TWTex |
| **URL** | Unknown (needs discovery) |
| **Expected Content** | Crowd-sourced top 100 motorcycle roads with scores |
| **Data Type** | Curated motorcycle route rankings |

## Research Checklist

### Discovery & Access
- [ ] Site exists and is accessible
- [ ] Top 100 list page is found
- [ ] List structure is documented (pagination, fields)

### Data Field Identification
- [ ] Route name
- [ ] State/location
- [ ] Rank (1-100)
- [ ] Score/rating
- [ ] Description
- [ ] Additional metadata (photos, comments, submission date)

### Technical Assessment
- [ ] WAF protection tested (Cloudflare, Akamai, etc.)
- [ ] Rate limits assessed
- [ ] Authentication requirements checked
- [ ] JavaScript rendering requirements identified
- [ ] API endpoints discovered (if any)

### Legal & Policy Review
- [ ] robots.txt reviewed: https://twtex.com/robots.txt
- [ ] Terms of Service reviewed for scraping restrictions
- [ ] Copyright status of crowd-sourced data assessed
- [ ] Legal assessment completed

## Discovery Script

```python
"""
TWTex.com Discovery Script
Tests accessibility, structure, and scraping feasibility
"""

import requests
from bs4 import BeautifulSoup
import time
from urllib.robotparser import RobotFileParser

# Step 1: Try common URLs for Top 100 list
POTENTIAL_URLS = [
    "https://twtex.com/top-100",
    "https://twtex.com/top100",
    "https://twtex.com/best-roads",
    "https://twtex.com/routes/top-100",
    "https://twtex.com/motorcycle-roads",
]

# Step 2: Configure session
session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
})

def check_url(url):
    """Test URL accessibility and analyze response"""
    try:
        response = session.get(url, timeout=10)
        
        return {
            'url': url,
            'status': response.status_code,
            'content_type': response.headers.get('content-type'),
            'cf_ray': response.headers.get('cf-ray'),  # Cloudflare detection
            'server': response.headers.get('server'),
            'has_content': len(response.text) > 0,
        }
    except Exception as e:
        return {'url': url, 'error': str(e)}

# Step 3: Check robots.txt
def check_robots_txt(base_url):
    """Parse robots.txt for restrictions"""
    rp = RobotFileParser()
    rp.set_url(f"{base_url}/robots.txt")
    try:
        rp.read()
        return {
            'exists': True,
            'can_fetch': rp.can_fetch('*', '/'),
            'crawl_delay': rp.crawl_delay('*'),
        }
    except Exception as e:
        return {'exists': False, 'error': str(e)}

# Step 4: Analyze page structure
def analyze_structure(html):
    """Extract list structure and data fields"""
    soup = BeautifulSoup(html, 'html.parser')
    
    # Look for common list patterns
    selectors = [
        ('class', 'route-item'),
        ('class', 'road-card'),
        ('class', 'top-100-item'),
        ('tag', 'ol'),  # Ordered lists
        ('tag', 'table'),
    ]
    
    findings = []
    for method, value in selectors:
        if method == 'class':
            elements = soup.find_all(class_=value)
        else:
            elements = soup.find_all(value)
        
        if elements:
            findings.append(f"Found {len(elements)} elements with {method}='{value}'")
    
    return findings

# Step 5: Test rate limits
def test_rate_limits(url):
    """Send multiple requests to detect rate limiting"""
    results = []
    for i in range(5):
        start = time.time()
        response = session.get(url, timeout=10)
        elapsed = time.time() - start
        results.append({
            'request': i + 1,
            'status': response.status_code,
            'time': elapsed,
            'retry_after': response.headers.get('retry-after'),
        })
        time.sleep(1)
    return results

# Main discovery workflow
def run_discovery():
    """Execute full discovery process"""
    print("=" * 60)
    print("TWTex.com Discovery Script")
    print("=" * 60)
    
    # Test URLs
    print("\n[1] Testing potential URLs...")
    for url in POTENTIAL_URLS:
        result = check_url(url)
        print(f"  {url}: {result.get('status', 'ERROR')}")
        if result.get('status') == 200:
            print(f"    ✓ Content-Type: {result.get('content_type')}")
            if result.get('cf_ray'):
                print(f"    ⚠ Cloudflare detected: {result.get('cf_ray')}")
    
    # Check robots.txt
    print("\n[2] Checking robots.txt...")
    robots_info = check_robots_txt("https://twtex.com")
    print(f"  Exists: {robots_info.get('exists')}")
    if robots_info.get('exists'):
        print(f"  Can fetch: {robots_info.get('can_fetch')}")
        print(f"  Crawl delay: {robots_info.get('crawl_delay')}")
    
    # Analyze structure (if URL found)
    print("\n[3] Analyzing page structure...")
    # TODO: Update with discovered URL
    # findings = analyze_structure(html)
    # for finding in findings:
    #     print(f"  {finding}")
    
    # Test rate limits
    print("\n[4] Testing rate limits...")
    # TODO: Update with discovered URL
    # results = test_rate_limits(discovered_url)
    # for result in results:
    #     print(f"  Request {result['request']}: {result['status']} ({result['time']:.2f}s)")
    
    print("\n" + "=" * 60)
    print("Discovery complete. Review findings above.")
    print("=" * 60)

if __name__ == "__main__":
    run_discovery()
```

## Decision Criteria

| Result | Action | Notes |
|--------|--------|-------|
| ✅ Accessible + no WAF + legal | **Proceed with UC-SRC-03** | Clear path to implementation |
| ⚠️ WAF but bypassable | **Proceed with caution** | May need residential proxies or headless browsers |
| ⚠️ Partial data (no scores) | **Assess value** | May still be useful for route discovery |
| ❌ ToS prohibits scraping | **Seek permission or DROP** | Do not violate explicit terms |
| ❌ Site doesn't exist | **DROP source** | Remove from research backlog |
| ❌ Requires paid access | **DROP source** | Not viable for MVP |
| ❌ Data is behind login | **Assess feasibility** | May need user-contributed data |
| ❌ Rate limits too strict | **DROP source** | Not viable for bulk extraction |

## Legal Review

### robots.txt Check
```
URL: https://twtex.com/robots.txt
Action: Parse for User-Agent: * restrictions
Look for: Disallow statements affecting list pages
```

### Terms of Service Review
```
URL: https://twtex.com/terms (or /legal, /tos)
Key clauses to check:
- Explicit scraping restrictions
- API usage policies
- Data ownership/copyright on user submissions
- Commercial use restrictions
```

### Legal Assessment Framework

| Factor | Question | Impact |
|--------|----------|--------|
| **Copyright** | Are rankings creative/original? | Facts not copyrightable; expression may be |
| **User submissions** | Do users own their contributions? | May affect ability to reuse descriptions |
| **Terms** | Does ToS explicitly prohibit scraping? | Binding contract if accessible |
| **Purpose** | Research vs commercial use? | Fair use more likely for research |
| **Market harm** | Does scraping harm their business? | Factor in fair use analysis |

**Recommendation**: If ToS is ambiguous, consider:
1. Caching/publicly available sources only
2. Rate limiting to minimize server load
3. Attribution to source
4. Contacting site owner for permission if high-value

## Timeline

| Week | Tasks | Duration |
|------|-------|----------|
| **Week 0, Day 1-2** | Execute discovery script, document findings, legal review | 4-8 hours |
| **Week 0, Day 3** | Decision meeting: proceed/drop source | 1 hour |
| **Week 0, Day 4-5** | If approved: begin UC-SRC-03 implementation | 4-8 hours |

## Success Criteria

Research is complete when:
1. ✅ URL is confirmed and accessible
2. ✅ Data structure is documented
3. ✅ Technical feasibility is assessed
4. ✅ Legal review is complete with go/no-go decision
5. ✅ Findings are documented in this file

## Next Steps (If Approved)

If research yields a positive result, proceed to:
- **UC-SRC-03**: TWTex scraper implementation
- **UC-SRC-04**: Data normalization and storage
- **UC-SRC-05**: Integration with route discovery service

---

**Created**: 2026-04-12
**Assigned To**: Research Agent
**Status**: 🔄 Pending
**Priority**: High (blocks UC-SRC-03)
