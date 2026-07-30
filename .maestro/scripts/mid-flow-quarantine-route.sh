#!/usr/bin/env bash
# S6-T6 / UC-SURF-06 — mid-flow riderReady quarantine flip (public_api)
#
# Called from Maestro via mid-flow-quarantine-route.js (ProcessBuilder).
# Fail-closed: non-zero exit if the mutation fails OR riderReady is not false.
#
# Env:
#   ROUTE_ID            default: cherohala-skyway (must match deep-link slug)
#   CONVEX_DEPLOYMENT   optional; forwarded to npx convex
#   IDENTITY_JSON       optional operator identity for requireIdentity

set -euo pipefail

ROUTE_ID="${ROUTE_ID:-cherohala-skyway}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

IDENTITY_JSON="${IDENTITY_JSON:-{\"subject\":\"s6t6-maestro-saved-reachability\",\"issuer\":\"https://laneshadow.test\"}}"
ARGS_JSON="$(printf '{"routeId":"%s","reason":"length_outlier"}' "$ROUTE_ID")"

export CONVEX_DEPLOYMENT="${CONVEX_DEPLOYMENT:-dev:quirky-panther-164}"

echo "mid-flow-quarantine: routeId=${ROUTE_ID} deployment=${CONVEX_DEPLOYMENT}" >&2

OUT="$(
  npx convex run curatedGeometryTestSupport:quarantineRouteByRouteIdPublic \
    "$ARGS_JSON" \
    --identity "$IDENTITY_JSON" 2>&1
)" || {
  echo "mid-flow-quarantine: convex run failed for ${ROUTE_ID}" >&2
  echo "$OUT" >&2
  exit 1
}

echo "$OUT"

# Fail-closed confirmation: riderReady must be explicit false in the mutation result.
if ! printf '%s' "$OUT" | grep -Eq '"riderReady"[[:space:]]*:[[:space:]]*false'; then
  echo "mid-flow-quarantine: FAIL riderReady not false for ${ROUTE_ID}" >&2
  echo "$OUT" >&2
  exit 2
fi

mkdir -p .tmp/S6-T6/evidence
# Sanitize routeId for filename (colons → underscores).
SAFE_ID="${ROUTE_ID//:/_}"
printf '%s\n' "$OUT" >".tmp/S6-T6/evidence/mid-flow-quarantine-${SAFE_ID}.json"
echo "mid-flow-quarantine: OK routeId=${ROUTE_ID} riderReady=false" >&2
exit 0
