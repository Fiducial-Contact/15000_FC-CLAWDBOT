# Fly.io 部署指南 (可选备选)

如果公司电脑无法长期在线/无法开 Tailscale Funnel，可以用 Fly.io 常驻部署。

注意: 本文件不包含任何真实 secret。

## 前提条件

1. 安装 Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. 登录: `fly auth login`

## 部署步骤 (概要)

```bash
cd ~/Projects/clawdbot
fly launch --no-deploy

# secrets
fly secrets set ANTHROPIC_API_KEY="<YOUR_ANTHROPIC_API_KEY>"
fly secrets set MS_APP_ID="<YOUR_APP_ID>"
fly secrets set MS_APP_PASSWORD="<YOUR_APP_PASSWORD>"
fly secrets set MS_TENANT_ID="<YOUR_TENANT_ID>"
fly secrets set GATEWAY_TOKEN="<RANDOM_TOKEN>"

fly deploy
```

然后把 Azure Bot Messaging Endpoint 改成:

```
https://<your-fly-host>.fly.dev/api/messages
```

更多细节看 `fly.toml` 和 Fly 官方文档。
