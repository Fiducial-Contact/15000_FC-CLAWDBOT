#!/bin/bash
set -e

PROFILE_DIR="/root/.clawdbot-cloud"
CONFIG_FILE="$PROFILE_DIR/clawdbot.json"

echo "=== Clawdbot Cloud Startup ==="

# Generate gateway token if not provided
if [ -z "$GATEWAY_TOKEN" ]; then
  GATEWAY_TOKEN=$(head -c 24 /dev/urandom | xxd -p)
  echo "Generated gateway token: $GATEWAY_TOKEN"
fi

# Create config file from environment variables
cat > "$CONFIG_FILE" << EOF
{
  "meta": {
    "lastTouchedVersion": "cloud",
    "lastTouchedAt": "$(date -Iseconds)"
  },
  "auth": {
    "profiles": {
      "anthropic:default": {
        "provider": "anthropic",
        "mode": "env"
      }
    }
  },
  "agents": {
    "defaults": {
      "models": {
        "anthropic/claude-opus-4-5": {
          "alias": "opus"
        }
      },
      "workspace": "/app/workspace",
      "maxConcurrent": 4,
      "subagents": {
        "maxConcurrent": 8
      }
    }
  },
  "tools": {
    "web": {
      "search": { "enabled": true },
      "fetch": { "enabled": true }
    }
  },
  "messages": {
    "ackReactionScope": "group-mentions"
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto"
  },
  "channels": {
    "msteams": {
      "enabled": true,
      "appId": "${MS_APP_ID}",
      "appPassword": "${MS_APP_PASSWORD}",
      "tenantId": "${MS_TENANT_ID}",
      "webhook": {
        "port": 3978,
        "path": "/api/messages"
      },
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist"
    }
  },
  "gateway": {
    "port": 18889,
    "mode": "local",
    "bind": "0.0.0.0",
    "auth": {
      "mode": "token",
      "token": "${GATEWAY_TOKEN}"
    }
  },
  "plugins": {
    "entries": {
      "msteams": {
        "enabled": true
      }
    }
  }
}
EOF

echo "Config file created at $CONFIG_FILE"

# Install msteams plugin
echo "Installing msteams plugin..."
cd "$PROFILE_DIR"

# Create package.json for the profile
cat > "$PROFILE_DIR/package.json" << 'PKGEOF'
{
  "name": "clawdbot-cloud-profile",
  "private": true,
  "dependencies": {}
}
PKGEOF

# Install plugin using clawdbot CLI
clawdbot --profile cloud plugins install @clawdbot/msteams || true

# Fix the workspace:* dependency bug if plugin was installed
if [ -d "$PROFILE_DIR/extensions/msteams" ]; then
  cd "$PROFILE_DIR/extensions/msteams"
  if grep -q '"workspace:\*"' package.json 2>/dev/null; then
    echo "Fixing workspace dependency bug..."
    sed -i 's/"clawdbot": "workspace:\*"/"clawdbot": "^2026.1.23"/' package.json
    npm install
  fi
fi

echo "Plugin installation complete"

# Show status
echo "=== Clawdbot Status ==="
clawdbot --profile cloud status || true

# Start gateway
echo "=== Starting Gateway ==="
echo "Dashboard: http://localhost:18889/?token=$GATEWAY_TOKEN"
echo "Teams webhook: http://localhost:3978/api/messages"

exec clawdbot --profile cloud gateway
