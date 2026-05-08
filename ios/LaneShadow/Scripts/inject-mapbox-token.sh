#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
PRIMARY_ENV_FILE="${PROJECT_ROOT}/.env.local"

find_fallback_env_file() {
  if ! command -v git >/dev/null 2>&1; then
    return
  fi

  while IFS= read -r line; do
    case "${line}" in
      "worktree "*)
        candidate_root="${line#worktree }"
        candidate_file="${candidate_root}/.env.local"
        if [ -f "${candidate_file}" ]; then
          printf '%s\n' "${candidate_file}"
          return
        fi
        ;;
    esac
  done < <(git -C "${PROJECT_ROOT}" worktree list --porcelain 2>/dev/null)
}

ENV_FILE="${PRIMARY_ENV_FILE}"
if [ ! -f "${ENV_FILE}" ]; then
  fallback="$(find_fallback_env_file || true)"
  if [ -n "${fallback}" ]; then
    ENV_FILE="${fallback}"
  fi
fi

resolve_token() {
  local key="$1"
  if [ ! -f "${ENV_FILE}" ]; then
    return
  fi

  sed -nE "s/^${key}=([^[:space:]#]+).*$/\\1/p" "${ENV_FILE}" | head -n1
}

mapbox_token=""
if [ -f "${ENV_FILE}" ]; then
  mapbox_token="$(resolve_token "MAPBOX_PUBLIC_TOKEN")"
  if [ -z "${mapbox_token}" ]; then
    mapbox_token="$(resolve_token "EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN")"
  fi
  if [ -z "${mapbox_token}" ]; then
    candidate_token="$(resolve_token "MAPBOX_ACCESS_TOKEN")"
    if [[ "${candidate_token}" == pk.* ]]; then
      mapbox_token="${candidate_token}"
    elif [ -n "${candidate_token}" ]; then
      echo "warning: MAPBOX_ACCESS_TOKEN is not a public pk token; leaving iOS MapboxConfig empty." >&2
    fi
  fi

  if [ -n "${mapbox_token}" ] && [[ "${mapbox_token}" != pk.* ]]; then
    echo "warning: Resolved iOS Mapbox token is not a public pk token; leaving MapboxConfig empty." >&2
    mapbox_token=""
  fi
fi

generated_dir="${PROJECT_ROOT}/ios/LaneShadow/Generated"
mkdir -p "${generated_dir}"
cat > "${generated_dir}/MapboxConfig.generated.swift" <<EOF
enum MapboxConfig {
    static let accessToken = "${mapbox_token}"
}
EOF

if [ -n "${mapbox_token}" ]; then
  echo "Injected Mapbox token from ${ENV_FILE}"
else
  echo "warning: Unable to resolve MAPBOX_ACCESS_TOKEN or MAPBOX_PUBLIC_TOKEN; generated empty MapboxConfig." >&2
fi
