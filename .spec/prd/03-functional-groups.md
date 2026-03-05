---
stability: FEATURE_SPEC
last_validated: 2026-03-04
prd_version: 1.0.0
---

# Functional Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Phase 1 Gap Closure | P1GAP | Complete partially-implemented weather overlays and comparison views |
| Saved Routes | SR | Route library management, browsing, and detail views |
| Personalization | PERS | Favorite roads, avoid preferences, elevation profiles |
| Post-Ride Experience | POST | Rating, notes, history, ride completion tracking |

## Use Case Summary

| Group | Count |
|-------|-------|
| Phase 1 Gap Closure (P1GAP) | 3 |
| Saved Routes (SR) | 4 |
| Personalization (PERS) | 4 |
| Post-Ride Experience (POST) | 3 |
| **Total** | **14** |

## Dependencies

```
P1GAP ─────► SR ─────► POST
              │
              └──────► PERS
```

- **P1GAP** has no dependencies (gap closure)
- **SR** depends on P1GAP (weather overlays should work before route details)
- **PERS** depends on SR (needs route management foundation)
- **POST** depends on SR (ratings attach to saved routes)
