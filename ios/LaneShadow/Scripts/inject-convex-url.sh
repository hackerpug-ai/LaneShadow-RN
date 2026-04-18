#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
PRIMARY_ENV_FILE="/Users/justinrich/Projects/LaneShadow/server/.env.local"

find_fallback_env_file() {
  if ! command -v git >/dev/null 2>&1; then
    return
  fi

  while IFS= read -r line; do
    case "${line}" in
      "worktree "*)
        candidate_root="${line#worktree }"
        candidate_file="${candidate_root}/server/.env.local"
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

if [ ! -f "${ENV_FILE}" ]; then
  echo "error: Missing Convex env file at ${PRIMARY_ENV_FILE}" >&2
  exit 1
fi

convex_url="$(sed -nE 's/^CONVEX_URL=([^[:space:]]+).*$/\1/p' "${ENV_FILE}" | head -n1)"
if [ -z "${convex_url}" ]; then
  deployment="$(sed -nE 's/^CONVEX_DEPLOYMENT=([^[:space:]#]+).*$/\1/p' "${ENV_FILE}" | head -n1)"
  deployment_name="${deployment#*:}"
  if [ -n "${deployment_name}" ] && [ "${deployment_name}" != "${deployment}" ]; then
    convex_url="https://${deployment_name}.convex.cloud"
  fi
fi

if [ -z "${convex_url}" ]; then
  echo "error: Unable to resolve CONVEX_URL from ${ENV_FILE}" >&2
  exit 1
fi

generated_dir="${PROJECT_ROOT}/ios/LaneShadow/Generated"
mkdir -p "${generated_dir}"
cat > "${generated_dir}/ConvexConfig.generated.swift" <<EOF
enum ConvexConfig {
    static let deploymentURL = "${convex_url}"
}
EOF

echo "Injected Convex URL from ${ENV_FILE}"
