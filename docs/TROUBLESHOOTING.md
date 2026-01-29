# Troubleshooting

## 1) `command not found: clawdbot`

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22
```

## 2) 端口被占用 (18789 / 3978)

```bash
clawdbot --profile fiducial gateway stop
lsof -i :18789
lsof -i :3978
```

## 3) Teams 插件加载失败

```bash
clawdbot --profile fiducial plugins install @clawdbot/msteams
clawdbot --profile fiducial plugins list
```

如果报 `workspace:*`，按 `README.md` 的 workaround。

## 4) Azure Web Chat / Teams 没回复

按顺序排:

1. `clawdbot --profile fiducial status`
2. `clawdbot --profile fiducial logs --follow`
3. Azure Bot → Configuration → Messaging Endpoint 是否是 `https://<tailscale>.ts.net/api/messages`
4. Tailscale Funnel 是否对外暴露了 3978

备注:

- 直接 `curl https://<tailscale>.ts.net/api/messages` 返回 `401`/`4xx` 并不等于不可达。
- 真正的 Bot Framework/Teams 请求会带鉴权/签名。

## 5) Teams App 安装失败 (权限)

需要 Teams Admin 批准/上架，见 `docs/TEAMS-ADMIN.md`。

## 诊断命令

```bash
clawdbot --profile fiducial status --deep
clawdbot --profile fiducial doctor
clawdbot --profile fiducial security audit --deep
```
