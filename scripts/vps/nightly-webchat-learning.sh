#!/usr/bin/env bash
#
# Nightly WebChat learner (VPS)
#
# Goal:
# - Read recent webchat sessions (Gateway local session logs)
# - Use the "work" agent (LLM) to synthesize a few high-confidence learnings per user
# - Write structured learning_events + learned_context back to Supabase
#
# This keeps WebChat thin: it only captures signals + shows results.
# The VPS does the actual "observer" work off-hours.
#
# Deploy to VPS (example):
#   sudo mkdir -p /root/clawd/scripts
#   sudo cp nightly-webchat-learning.sh /root/clawd/scripts/nightly-webchat-learning.sh
#   sudo chmod +x /root/clawd/scripts/nightly-webchat-learning.sh
#
# Env:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
#
# Optional env:
# - CLAWD_ENV_FILE (override env file path)
# - LEARN_MAX_USERS (default 5)
# - LEARN_ACTIVE_MINUTES (default 2880 = 48h)
# - LEARN_MAX_MESSAGES (default 40)
# - LEARN_MAX_CHARS_PER_USER (default 8000)
# - LEARN_MAX_EVENTS_PER_USER (default 3)
# - LEARN_MIN_CONFIDENCE (default 0.5)
# - LEARN_MAX_LEARNED_CONTEXT (default 50)
#
# Cron example (UTC):
#   5 20 * * * /root/clawd/scripts/nightly-webchat-learning.sh >> /tmp/clawdbot/nightly-webchat-learning.log 2>&1
#

set -euo pipefail

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

ENV_CANDIDATES=()
if [ -n "${CLAWD_ENV_FILE:-}" ]; then
  ENV_CANDIDATES+=("${CLAWD_ENV_FILE}")
fi

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
  log "ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

AGENT_ID="${LEARN_AGENT_ID:-work}"
SESSION_STORE="${LEARN_SESSION_STORE:-/root/.clawdbot/agents/work/sessions/sessions.json}"
SESSIONS_DIR="${LEARN_SESSIONS_DIR:-/root/.clawdbot/agents/work/sessions}"

MAX_USERS="${LEARN_MAX_USERS:-5}"
ACTIVE_MINUTES="${LEARN_ACTIVE_MINUTES:-2880}"
MAX_MESSAGES="${LEARN_MAX_MESSAGES:-40}"
MAX_CHARS_PER_USER="${LEARN_MAX_CHARS_PER_USER:-8000}"
MAX_EVENTS_PER_USER="${LEARN_MAX_EVENTS_PER_USER:-3}"
MIN_CONFIDENCE="${LEARN_MIN_CONFIDENCE:-0.5}"
MAX_LEARNED_CONTEXT="${LEARN_MAX_LEARNED_CONTEXT:-50}"

NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
CUTOFF_24H="$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)"

log "Nightly learner start (agent=${AGENT_ID}, maxUsers=${MAX_USERS}, activeMinutes=${ACTIVE_MINUTES})"

SESSIONS_JSON="$(clawdbot sessions --store "$SESSION_STORE" --json --active "$ACTIVE_MINUTES")"

USER_SESSIONS_JSON="$(echo "$SESSIONS_JSON" | jq -c --argjson max "$MAX_USERS" '
  .sessions
  | map(select(.key | test("^agent:work:webchat:dm:")))
  | map(. + { userId: (.key | capture("agent:work:webchat:dm:(?<userId>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})").userId) })
  | group_by(.userId)
  | map(max_by(.updatedAt))
  | sort_by(.updatedAt)
  | reverse
  | .[0:$max]
')"

USER_COUNT="$(echo "$USER_SESSIONS_JSON" | jq 'length')"
if [ "$USER_COUNT" -eq 0 ]; then
  log "No active webchat users in the last ${ACTIVE_MINUTES} minutes. Exit."
  exit 0
fi

log "Selected ${USER_COUNT} webchat users for learning sweep"

fetch_signal_summary() {
  local user_id="$1"
  curl -s \
    "${SUPABASE_URL}/rest/v1/user_signals?select=signal_type,payload,created_at&user_id=eq.${user_id}&created_at=gte.${CUTOFF_24H}&order=created_at.desc&limit=200" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
}

extract_transcript() {
  local session_id="$1"
  local path="${SESSIONS_DIR}/${session_id}.jsonl"
  if [ ! -f "$path" ]; then
    echo ""
    return 0
  fi

python3 - "$path" "$MAX_MESSAGES" "$MAX_CHARS_PER_USER" <<'PY'
import json
import sys

path = sys.argv[1]
max_messages = int(sys.argv[2])
max_chars = int(sys.argv[3])

PROFILE_SYNC_PREFIX = "[fc:profile-sync:v1]"

def extract_text_blocks(content):
  if not isinstance(content, list):
    return ""
  parts = []
  for block in content:
    if not isinstance(block, dict):
      continue
    if block.get("type") == "text" and isinstance(block.get("text"), str):
      parts.append(block["text"])
  return "\n".join(parts).strip()

messages = []
with open(path, "r", encoding="utf-8") as f:
  for line in f:
    line = line.strip()
    if not line:
      continue
    try:
      obj = json.loads(line)
    except Exception:
      continue
    if obj.get("type") != "message":
      continue
    msg = obj.get("message")
    if not isinstance(msg, dict):
      continue
    role = msg.get("role")
    if role not in ("user", "assistant"):
      continue
    text = extract_text_blocks(msg.get("content"))
    if not text:
      continue
    if role == "user" and text.strip().startswith(PROFILE_SYNC_PREFIX):
      continue
    messages.append((role, text))

messages = messages[-max_messages:]

out_lines = []
for role, text in messages:
  prefix = "U:" if role == "user" else "A:"
  # avoid huge blocks
  text = text.strip()
  if len(text) > 800:
    text = text[:800] + "…"
  out_lines.append(f"{prefix} {text}")

transcript = "\n".join(out_lines).strip()
if len(transcript) > max_chars:
  transcript = transcript[-max_chars:]
print(transcript)
PY
}

# Build a single payload for the LLM (keeps it flexible, not rule-based)
INPUT_PAYLOAD="$(mktemp)"
OUTPUT_PAYLOAD="$(mktemp)"
trap 'rm -f "$INPUT_PAYLOAD" "$OUTPUT_PAYLOAD"' EXIT

{
  echo "{"
  echo "  \"generatedAt\": \"${NOW_ISO}\","
  echo "  \"constraints\": {"
  echo "    \"maxEventsPerUser\": ${MAX_EVENTS_PER_USER},"
  echo "    \"minConfidenceForWriteback\": ${MIN_CONFIDENCE},"
  echo "    \"noRawMessageQuotes\": true"
  echo "  },"
  echo "  \"users\": ["

  idx=0
  echo "$USER_SESSIONS_JSON" | jq -c '.[]' | while read -r row; do
    user_id="$(echo "$row" | jq -r '.userId')"
    session_id="$(echo "$row" | jq -r '.sessionId')"
    updated_at="$(echo "$row" | jq -r '.updatedAt')"
    session_key="$(echo "$row" | jq -r '.key')"

    transcript="$(extract_transcript "$session_id")"
    signals="$(fetch_signal_summary "$user_id")"

    # Summarize signals locally (counts + top topics) to avoid shipping raw payloads to the LLM.
    signals_summary="$(echo "$signals" | jq -c '
      def topicTags:
        if .signal_type == "topic_mentioned" and (.payload.topics? | type) == "array" then .payload.topics
        elif .signal_type == "message_sent" and (.payload.topicTags? | type) == "array" then .payload.topicTags
        else [] end;
      {
        sample: (length),
        counts: (map(.signal_type) | group_by(.) | map({type: .[0], count: length}) | sort_by(-.count)),
        topTopics: (map(topicTags[]) | group_by(.) | map({topic: .[0], count: length}) | sort_by(-.count) | .[0:8]),
        feedback: (
          map(select(.signal_type == "feedback") | .payload.value) | group_by(.) | map({value: .[0], count: length})
        )
      }'
    )"

    if [ "$idx" -gt 0 ]; then
      echo "    ,"
    fi

    jq -n \
      --arg userId "$user_id" \
      --arg sessionKey "$session_key" \
      --argjson updatedAt "$updated_at" \
      --arg transcript "$transcript" \
      --argjson signals "$signals_summary" \
      '{userId: $userId, sessionKey: $sessionKey, sessionUpdatedAt: $updatedAt, transcript: $transcript, signals: $signals}'

    idx=$((idx + 1))
  done

  echo "  ]"
  echo "}"
} > "$INPUT_PAYLOAD"

PROMPT_FILE="$(mktemp)"
trap 'rm -f "$INPUT_PAYLOAD" "$OUTPUT_PAYLOAD" "$PROMPT_FILE"' EXIT

cat > "$PROMPT_FILE" <<'PROMPT'
You are running a **Nightly WebChat Learner** job for a multi-user team assistant.

Core principle: learn by observation, not interrogation. Stay flexible (LLMs generalize; don't behave like a hardcoded rules engine).

Hard constraints:
- Follow the data allowlist: only learn software/tools, work topics, response preferences, and infrastructure/quality signals.
- Do NOT include personal life details, secrets, or sensitive info.
- Do NOT quote raw user messages back as evidence. Use short paraphrases like "asked about AE expressions twice".
- Output MUST be strict JSON only (no markdown).

Task:
Given the input JSON payload (users + transcripts + signals summaries), produce learning insights per user.

Output schema:
{
  "generatedAt": "<iso>",
  "insights": [
    {
      "userId": "<uuid>",
      "dimension": "skill-level" | "interaction-style" | "topic-interests" | "frustration-signals",
      "insight": "<short, actionable, work-safe>",
      "confidence": <0..1>,
      "evidence": ["<short evidence 1>", "<short evidence 2>"]
    }
  ]
}

Guidelines:
- Prefer 0–3 insights per user (quality over quantity).
- confidence >= 0.5 only if you saw at least 2 independent signals/evidence points.
- If you have only 1 weak signal, either omit it or set confidence < 0.5.
PROMPT

PROMPT_TEXT="$(cat "$PROMPT_FILE")"
INPUT_TEXT="$(cat "$INPUT_PAYLOAD")"

AGENT_MESSAGE="$(printf "%s\n\nINPUT:\n%s" "$PROMPT_TEXT" "$INPUT_TEXT")"
AGENT_OUTPUT="$(clawdbot agent --agent "$AGENT_ID" --message "$AGENT_MESSAGE" --thinking high --json --timeout 900)"

echo "$AGENT_OUTPUT" | jq -r '.result.payloads[0].text // ""' > "$OUTPUT_PAYLOAD"

if ! python3 - "$OUTPUT_PAYLOAD" >/dev/null <<'PY'
import json
import sys

raw = open(sys.argv[1], "r", encoding="utf-8").read().strip()
if not raw:
  raise SystemExit("empty agent output")

# Strip code fences if present (defensive)
if raw.startswith("```"):
  raw = raw.split("```", 2)[1].strip()

start = raw.find("{")
end = raw.rfind("}")
if start == -1 or end == -1 or end <= start:
  raise SystemExit("no json object found")

obj = json.loads(raw[start:end+1])
if "insights" not in obj or not isinstance(obj["insights"], list):
  raise SystemExit("missing insights[]")
PY
then
  log "ERROR: Agent output is not valid JSON. Aborting."
  log "Raw output (first 400 chars): $(head -c 400 "$OUTPUT_PAYLOAD" | tr '\n' ' ' )"
  exit 1
fi

INSIGHTS_JSON="$(python3 - "$OUTPUT_PAYLOAD" <<'PY'
import json
import sys
import re

raw = open(sys.argv[1], "r", encoding="utf-8").read().strip()
if raw.startswith("```"):
  raw = raw.split("```", 2)[1].strip()
start = raw.find("{")
end = raw.rfind("}")
obj = json.loads(raw[start:end+1])

allowed = {"skill-level","interaction-style","topic-interests","frustration-signals"}
uuid_re = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")

out = []
for item in obj.get("insights", []):
  if not isinstance(item, dict):
    continue
  user_id = item.get("userId")
  dimension = item.get("dimension")
  insight = item.get("insight")
  confidence = item.get("confidence")
  evidence = item.get("evidence", [])

  if not isinstance(user_id, str) or not uuid_re.match(user_id):
    continue
  if dimension not in allowed:
    continue
  if not isinstance(insight, str) or not insight.strip():
    continue
  if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
    continue
  if not isinstance(evidence, list):
    evidence = []
  evidence = [e for e in evidence if isinstance(e, str) and e.strip()][:5]

  out.append({
    "userId": user_id,
    "dimension": dimension,
    "insight": insight.strip(),
    "confidence": float(confidence),
    "evidence": evidence,
  })

print(json.dumps(out))
PY
)"

INSIGHT_COUNT="$(echo "$INSIGHTS_JSON" | jq 'length')"
if [ "$INSIGHT_COUNT" -eq 0 ]; then
  log "No valid insights produced. Exit."
  exit 0
fi

log "Validated insights: ${INSIGHT_COUNT}"

# Insert learning_events (always record, even low confidence).
EVENT_ROWS="$(echo "$INSIGHTS_JSON" | jq -c --arg now "$NOW_ISO" '
  map({
    user_id: .userId,
    dimension: .dimension,
    insight: .insight,
    confidence: .confidence,
    evidence: (.evidence // []),
    source: "heartbeat",
    created_at: $now
  })
')"

INSERT_STATUS="$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/rest/v1/learning_events" \
  -X POST \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "${EVENT_ROWS}")"

INSERT_CODE="$(echo "$INSERT_STATUS" | tail -1)"
if [ "$INSERT_CODE" != "201" ] && [ "$INSERT_CODE" != "200" ] && [ "$INSERT_CODE" != "204" ]; then
  log "ERROR: Failed to insert learning_events (HTTP ${INSERT_CODE})"
  exit 1
fi

log "Inserted learning_events (HTTP ${INSERT_CODE})"

# Update user_profiles.learned_context for high-confidence insights (append-only, dedupe, cap).
HIGH_CONF="$(echo "$INSIGHTS_JSON" | jq -c --argjson min "$MIN_CONFIDENCE" '
  map(select(.confidence >= $min))
  | group_by(.userId)
  | map({ userId: .[0].userId, items: (map(.insight) | unique) })
')"

HIGH_USERS="$(echo "$HIGH_CONF" | jq 'length')"
if [ "$HIGH_USERS" -eq 0 ]; then
  log "No insights above confidence >= ${MIN_CONFIDENCE}; skipping learned_context update."
  exit 0
fi

log "Updating learned_context for ${HIGH_USERS} users (confidence >= ${MIN_CONFIDENCE})"

echo "$HIGH_CONF" | jq -c '.[]' | while read -r row; do
  user_id="$(echo "$row" | jq -r '.userId')"
  new_items="$(echo "$row" | jq -c '.items')"

  existing_json="$(curl -s \
    "${SUPABASE_URL}/rest/v1/user_profiles?select=learned_context&user_id=eq.${user_id}&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")"

  existing_ctx="$(echo "$existing_json" | jq -c '.[0].learned_context // []' 2>/dev/null || echo '[]')"

  merged="$(jq -n --argjson a "$existing_ctx" --argjson b "$new_items" --argjson cap "$MAX_LEARNED_CONTEXT" '
    ([$a[]?, $b[]?] | map(select(type=="string" and (.|length)>0)) | unique) as $all
    | (if ($all|length) > $cap then ($all[0:$cap]) else $all end)
  ')"

  upsert_body="$(jq -n --arg user "$user_id" --argjson ctx "$merged" '[{user_id: $user, learned_context: $ctx}]')"

  upsert_status="$(curl -s -w "\n%{http_code}" \
    "${SUPABASE_URL}/rest/v1/user_profiles?on_conflict=user_id" \
    -X POST \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates,return=minimal" \
    -d "${upsert_body}")"

  code="$(echo "$upsert_status" | tail -1)"
  if [ "$code" != "201" ] && [ "$code" != "200" ] && [ "$code" != "204" ]; then
    log "WARN: Failed to upsert learned_context for user ${user_id} (HTTP ${code})"
  else
    log "Upserted learned_context for user ${user_id} (HTTP ${code})"
  fi
done

log "Nightly learner completed"
