FROM node:22-slim

WORKDIR /app

# Install clawdbot globally
RUN npm install -g clawdbot@latest

# Create profile directory
RUN mkdir -p /root/.clawdbot-cloud/extensions

# Copy workspace (AI personas)
COPY workspace /app/workspace

# Copy startup script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose ports
# 3978 = Teams webhook (required for Azure Bot)
# 18889 = Gateway dashboard (optional, for monitoring)
EXPOSE 3978 18889

# Environment variables (set these in Fly.io secrets)
# ANTHROPIC_API_KEY - required
# MS_APP_ID - Azure Bot App ID
# MS_APP_PASSWORD - Azure Bot Client Secret
# MS_TENANT_ID - Azure Tenant ID
# GATEWAY_TOKEN - optional, for dashboard auth

ENTRYPOINT ["/app/docker-entrypoint.sh"]
