#!/bin/bash
# Fiducial Clawdbot Launcher

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

echo "🦞 Starting Fiducial Clawdbot..."
echo "   Profile: fiducial"
echo "   Port: 18789"
echo ""

# Start gateway
clawdbot --profile fiducial gateway --port 18789
