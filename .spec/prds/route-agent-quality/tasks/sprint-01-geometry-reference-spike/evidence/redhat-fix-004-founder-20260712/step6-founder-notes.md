# Step 6 — Founder-Operator cold-boot open (REDHAT-FIX-004)

**run_id:** 20260712T100751Z (post REDHAT-FIX-001/002/003 land)
**device:** iPhone 17 sim `9051A0C2-CCB5-4D0F-AAAC-F03F74719352`
**app:** com.hackerpug.laneshadow

## Checklist
- [x] App cold-booted via Maestro stopApp+launchApp clearState path (iOS-targeted `maestro --device $UDID`)
- [x] Authenticated with e2e test login when required
- [x] Opened recovered route deep link `laneshadow:///curated-route/motorcycleroads:twist-of-tepusquet-loop`
- [x] Route Detail shows name **Twist of Tepusquet Loop**
- [x] `curated-detail-map` visible
- [x] Honest paint oracles visible: `map-settled`, `mapbox-road-polyline-layer`, `curated-route-detail-line-painted`
- [x] Not Maestro-only terminal substitution for the observation claim — founder screenshot archived as step6/step7 PNG

## Evidence
- Maestro assist log: `step6-7-maestro-ios.log` (EXIT=0)
- Screenshot: `step6-route-detail-open.png` / `step7-road-line.png`
