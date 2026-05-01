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

  # Capture the raw value, then strip surrounding quotes / shell-style $VAR refs.
  local raw
  raw="$(sed -nE "s/^${key}=(.+)$/\\1/p" "${ENV_FILE}" | head -n1)"
  raw="${raw%%#*}"           # drop trailing comments
  raw="${raw%%[[:space:]]*}" # drop trailing whitespace
  raw="${raw#\"}"
  raw="${raw%\"}"
  raw="${raw#\'}"
  raw="${raw%\'}"
  printf '%s' "${raw}"
}

clerk_key=""
if [ -f "${ENV_FILE}" ]; then
  clerk_key="$(resolve_token "CLERK_PUBLISHABLE_KEY")"
  if [ -z "${clerk_key}" ] || [[ "${clerk_key}" == \$* ]]; then
    clerk_key="$(resolve_token "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY")"
  fi
fi

generated_dir="${PROJECT_ROOT}/ios/LaneShadow/Generated"
mkdir -p "${generated_dir}"
cat > "${generated_dir}/ClerkConfig.generated.swift" <<EOF
enum ClerkConfig {
    static let publishableKey = "${clerk_key}"
}
EOF

if [ -n "${clerk_key}" ]; then
  echo "Injected Clerk publishable key from ${ENV_FILE}"
else
  echo "warning: Unable to resolve CLERK_PUBLISHABLE_KEY or EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY; generated empty ClerkConfig." >&2
fi
