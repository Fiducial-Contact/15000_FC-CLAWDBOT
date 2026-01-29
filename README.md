# Fiducial Communications AI Assistant (Microsoft Teams)

> **给 LLM 的说明**: 这是一个 Clawdbot (AI 聊天机器人网关) 配置项目。VPS 已部署完成，等待 Teams Admin 权限。
>
> **⚠️ 额外说明（Haiwei 个人 Agent）**: 本仓库同时记录 Haiwei 的个人 Agent 运行配置/自动化（心跳、深夜研究、Notion Activity Log、安全加固）。团队使用 Teams Bot 的配置/流程仍以本文档 Teams 部分为准，避免混淆。

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

## Haiwei 个人 Agent（非团队配置）

> 这一部分是 Haiwei 个人 Agent 的运行说明，与 Teams 团队 Bot 解耦。

**运行目录**
- `/root/clawd-personal`

**自动化时间表（London）**
- 心跳：08:00-23:00，每 30 分钟
- 深夜心跳：03:00（仅紧急才发消息）
- 深度研究：00:30 / 05:30
- 研究复查：07:30（生成 `memory/briefing-prep.md`）
- 早报：08:00
- 日常研究：10:00 / 22:00
- 睡觉提醒：23:00 / 23:45
- Twitter Likes → Notion：12:00 / 20:00

**行为观察（Notion Activity Log）**
- 记录由观察器生成，AI 不知情
- 内容统一为英文
- 脚本：`/root/clawd-personal/scripts/activity-observer.py`

**安全加固（已执行）**
- SSH 改为 2222，root 登录禁用
- 启用 UFW + fail2ban
- WhatsApp/Teams groupPolicy 改为 allowlist

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
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot pairing list msteams"
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot pairing approve msteams <code>"
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
| SSH | `ssh -p 2222 haiwei@46.224.225.164` (需要 1Password SSH Agent 中的密钥) |
| Tailscale | `clawdbot.tail297e45.ts.net` |
| Teams Webhook | `https://clawdbot.tail297e45.ts.net/api/messages` |
| Gateway Port | 18789 (loopback) |
| Teams Webhook Port | 3978 (via Funnel) |

---

## 常用命令

```bash
# SSH 到 VPS
ssh -p 2222 haiwei@46.224.225.164

# 检查状态
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot status"

# 查看日志
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot logs -f"

# 重启 gateway
ssh -p 2222 haiwei@46.224.225.164 "sudo XDG_RUNTIME_DIR=/run/user/0 systemctl --user restart clawdbot-gateway"

# Pairing 管理
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot pairing list msteams"
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot pairing approve msteams <code>"
```

---

## 新团队成员开通

1. 成员在 Teams 私聊 bot 发一句话
2. 你批准 pairing：

```bash
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot pairing list msteams"
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot pairing approve msteams <code>"
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
cp .env.example .env.local
# Edit .env.local with your values
pnpm install
pnpm dev
```

Open http://localhost:3000

### Environment Variables

**Required (core app):**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_GATEWAY_WS_URL` | Gateway WebSocket URL (e.g., `ws://host:18789`) |
| `NEXT_PUBLIC_GATEWAY_TOKEN` | Gateway auth token (required if gateway auth is enabled) |

**Optional (feature-specific):**

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Required for `/api/push/send` |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Required for file uploads |
| `NEXT_PUBLIC_SUPABASE_SIGNED_URL_TTL_SECONDS` | Signed URL TTL for uploads |
| `NEXT_PUBLIC_CHAT_IMAGE_MAX_MB` | Image size limit (MB) |
| `NEXT_PUBLIC_CHAT_FILE_MAX_MB` | File size limit (MB) |
| `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` | Required for push notifications UI |
| `WEB_PUSH_PRIVATE_KEY` | Required for push send API |
| `WEB_PUSH_API_TOKEN` | Required for push send API + relay |
| `WEB_PUSH_SUBJECT` | VAPID subject for push |
| `GATEWAY_WS_URL` | Required by push relay script |
| `GATEWAY_TOKEN` | Required by push relay script (if gateway auth enabled) |
| `WEB_PUSH_SEND_URL` | Push relay target URL (e.g., `https://your-app.com/api/push/send`) |

See `.env.example` for a complete template.

### Gateway Connection

```
Protocol: WebSocket
Default Port: 18789
Agent: work (claude-opus-4-5)
Methods: chat.send, chat.history, connect
```

### Required Supabase Tables

The app expects the following Supabase table for push notifications:

```sql
create table if not exists web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  peer_id text,
  user_agent text,
  updated_at timestamptz default now()
);

create index if not exists idx_web_push_user on web_push_subscriptions(user_id);
create index if not exists idx_web_push_peer on web_push_subscriptions(peer_id);
```

The skills page expects the following Supabase table:

```sql
create table if not exists skills_registry (
  id uuid primary key default gen_random_uuid(),
  skill_name text unique not null,
  display_name text,
  description text,
  creator_id uuid references auth.users(id) on delete set null,
  creator_email text,
  source text not null default 'workspace',
  status text not null default 'active',
  icon text,
  triggers text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_skills_registry_name on skills_registry(skill_name);
```

---

Built by Haiwei | Fiducial Communications | 2026-01-25
