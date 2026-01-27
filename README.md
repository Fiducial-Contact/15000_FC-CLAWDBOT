# Fiducial Communications AI Assistant (Microsoft Teams)

> **给 LLM 的说明**: 这是一个 Clawdbot (AI 聊天机器人网关) 配置项目。VPS 已部署完成，等待 Teams Admin 权限。

---

## 当前状态

| 项目 | 状态 |
|------|------|
| VPS (Hetzner) | ✅ 运行中 `46.224.225.164` |
| Clawdbot Gateway | ✅ systemd 运行 |
| WhatsApp | ✅ 已连接 `+8615258727081` |
| Teams 配置 | ✅ 已配置 |
| Tailscale Funnel | ✅ `https://clawdbot.tail297e45.ts.net` → 3978 |
| Azure Bot Endpoint | ✅ 已更新 |
| **Teams App 权限** | ❌ 等待 Admin |

---

## 剩余步骤：获取 Teams 权限

### 方式一：让 IT 给你 Teams 管理员权限（推荐）

发给 IT：

> Hi，请把我添加为 Teams 管理员。
>
> **操作步骤：**
> 1. 登录 [Microsoft 365 Admin Center](https://admin.microsoft.com)
> 2. 左侧 **Users** → **Active users**
> 3. 找到我的账户，点击进入
> 4. **Manage roles** → 勾选 **Teams Administrator**
> 5. **Save changes**

拿到权限后，自己去 [Teams Admin Center](https://admin.teams.microsoft.com) → **Teams apps** → **Manage apps** → **Upload new app** → 上传 `teams-app/haiweis-unpaid-intern.zip`

### 方式二：让 IT 开启自定义应用上传权限

发给 IT：

> Hi，请帮我开启 Teams 自定义应用上传权限。
>
> **操作步骤：**
> 1. 登录 [Teams Admin Center](https://admin.teams.microsoft.com)
> 2. 左侧 **Teams apps** → **Setup policies**
> 3. 点击 **Global (Org-wide default)**
> 4. 找到 **Upload custom apps** → 开启 **On**
> 5. 点 **Save**

IT 操作完成后（可能需要几小时生效），你自己上传：
1. 打开 Teams → 左侧 **Apps** → 底部 **Manage your apps**
2. **Upload an app** → **Upload a custom app**
3. 选择 `teams-app/haiweis-unpaid-intern.zip`

### 方式三：让 IT 直接上传 App

发给 IT `docs/TEAMS-ADMIN.md` + `teams-app/haiweis-unpaid-intern.zip`

---

## Teams 权限拿到后

1. 在 Teams 里找到 `haiweis-unpaid-intern` bot
2. 私聊发一句话
3. 因为配置了 `dmPolicy: "pairing"`，第一次需要批准：

```bash
ssh root@46.224.225.164 "clawdbot pairing list msteams"
ssh root@46.224.225.164 "clawdbot pairing approve msteams <code>"
```

---

## 目标

1. 团队成员都可以在 Teams **私聊**里问技术问题 (After Effects / Premiere / workflow)
2. 新成员接入用 **pairing** (不用维护 allowlist)
3. 每个成员的 DM 会话 **彼此隔离** (`dmScope: per-channel-peer`)
4. 群聊/频道默认不启用

---

## VPS 信息

| 项目 | 值 |
|------|-----|
| IP | `46.224.225.164` |
| SSH | `ssh root@46.224.225.164` |
| Tailscale | `clawdbot.tail297e45.ts.net` |
| Teams Webhook | `https://clawdbot.tail297e45.ts.net/api/messages` |
| Gateway Port | 18789 (loopback) |
| Teams Webhook Port | 3978 (via Funnel) |

---

## 常用命令

```bash
# SSH 到 VPS
ssh root@46.224.225.164

# 检查状态
ssh root@46.224.225.164 "clawdbot status"

# 查看日志
ssh root@46.224.225.164 "clawdbot logs -f"

# 重启 gateway
ssh root@46.224.225.164 "clawdbot gateway restart"

# Pairing 管理
ssh root@46.224.225.164 "clawdbot pairing list msteams"
ssh root@46.224.225.164 "clawdbot pairing approve msteams <code>"
```

---

## 新团队成员开通

1. 成员在 Teams 私聊 bot 发一句话
2. 你批准 pairing：

```bash
ssh root@46.224.225.164 "clawdbot pairing list msteams"
ssh root@46.224.225.164 "clawdbot pairing approve msteams <code>"
```

---

## 文件/目录

```
clawdbot/
├── README.md
├── config/clawdbot.json
├── docs/
│   ├── SETUP.md
│   ├── TEAMS-ADMIN.md
│   ├── TROUBLESHOOTING.md
│   └── FLYIO-DEPLOY.md
├── teams-app/
│   ├── manifest.json
│   ├── color.png
│   ├── outline.png
│   └── haiweis-unpaid-intern.zip
└── workspace/
    ├── AGENTS.md
    ├── SOUL.md
    └── USER.md
```

---

## 安全说明

- IT 只需要: `teams-app/haiweis-unpaid-intern.zip` + `docs/TEAMS-ADMIN.md`
- 不要分享 VPS SSH 密钥、config 里的 token/secret

---

## Web Chat App

Branded web chat interface for Fiducial Communications team to interact with their AI assistant.

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + Fiducial brand tokens
- **Auth**: Supabase Auth
- **Backend**: Clawdbot Gateway WebSocket
- **Deploy**: Vercel

### Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

### Gateway Connection

```
Host: 46.224.225.164:18789
Agent: work (claude-sonnet-4-5)
Methods: chat.send, chat.history, connect
```

---

Built by Haiwei | Fiducial Communications | 2026-01-25
