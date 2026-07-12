# Step 7 — Founder-Operator visual: copper road line (REDHAT-FIX-004)

**Question:** Does the cold-boot Route Detail map show a visible copper/road polyline for Twist of Tepusquet Loop (not blank grey + blue puck only)?

## Verdict: YES — PASS

**Observed (Founder / operator visual review of `step7-road-line.png`):**
- Route Detail header shows **Twist of Tepusquet Loop**
- Map viewport is map tiles (not Expo launcher, not blank grey only)
- Copper/orange road polyline is painted on the map following the canyon/loop geometry
- Approximate-location badge not the sole geometry presentation
- Screenshot size 562334 bytes (comparable to REDHAT-FIX-001 painted evidence ~462KB; not the 185KB Expo-launcher miss)

**Rejected signatures:**
- blank grey map + blue location puck only (H1)
- Expo development-server launcher (earlier failed capture)

**Authority:** REDHAT-FIX-004 AC-4 / H4 — founder eyes after REDHAT-FIX-001/002 paint+oracle fixes.
