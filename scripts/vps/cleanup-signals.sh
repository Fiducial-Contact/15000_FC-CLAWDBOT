#!/usr/bin/env bash
# VPS cron job: delete user_signals older than 30 days
# Deploy to crontab: 0 3 * * * /root/clawd/scripts/cleanup-signals.sh >> /var/log/clawd-cleanup.log 2>&1
#
# Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment or sourced from /root/.clawd-env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_CANDIDATES=()
if [ -n "${CLAWD_ENV_FILE:-}" ]; then
  ENV_CANDIDATES+=("${CLAWD_ENV_FILE}")
fi
# Common layouts:
# - /root/clawd/scripts/cleanup-signals.sh -> /root/clawd/.clawd-env
# - repo root: scripts/vps/cleanup-signals.sh -> repo root .clawd-env
ENV_CANDIDATES+=(
  "${SCRIPT_DIR}/../.clawd-env"
  "${SCRIPT_DIR}/../../.clawd-env"
  "${SCRIPT_DIR}/.clawd-env"
)

for candidate in "${ENV_CANDIDATES[@]}"; do
  if [ -f "$candidate" ]; then
    # shellcheck source=/dev/null
    source "$candidate"
    break
  fi
done

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -X POST \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query": "DELETE FROM user_signals WHERE created_at < NOW() - INTERVAL '\''30 days'\''"}' \
  2>/dev/null) || true

HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] OK: Signals cleanup completed (HTTP $HTTP_CODE)"
else
  # Fallback: use direct PostgREST delete with date filter
  CUTOFF=$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-30d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "")
  if [ -n "$CUTOFF" ]; then
    FALLBACK_RESPONSE=$(curl -s -w "\n%{http_code}" \
      "${SUPABASE_URL}/rest/v1/user_signals?created_at=lt.${CUTOFF}" \
      -X DELETE \
      -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Prefer: return=minimal" \
      2>/dev/null) || true

    FALLBACK_CODE=$(echo "$FALLBACK_RESPONSE" | tail -1)
    if [ "$FALLBACK_CODE" = "200" ] || [ "$FALLBACK_CODE" = "204" ]; then
      echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] OK: Signals cleanup via REST (cutoff: $CUTOFF, HTTP $FALLBACK_CODE)"
    else
      BODY=$(echo "$FALLBACK_RESPONSE" | sed '$d' | head -c 400)
      echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERROR: REST cleanup failed (HTTP $FALLBACK_CODE) body: $BODY"
      exit 1
    fi
  else
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERROR: Could not compute cutoff date"
    exit 1
  fi
fi
