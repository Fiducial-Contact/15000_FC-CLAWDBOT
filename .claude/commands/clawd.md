---
name: Clawdbot Operations
description: 远程主机连接、状态检查、技术文档查询
category: Operations
tags: [clawdbot, vps, ssh, operations, team]
---

# Clawdbot 运维指南

## 项目背景

这是 **Fiducial Communications 团队**的 AI 助手项目，基于 Clawdbot Gateway 构建。

- **用途**：团队成员通过 Teams/WhatsApp 私聊咨询技术问题 (After Effects / Premiere / workflow)
- **架构**：VPS 运行 Clawdbot Gateway → 多渠道接入 (Teams, WhatsApp, Web Chat)
- **隔离**：每个成员的 DM 会话彼此隔离 (`dmScope: per-channel-peer`)

## 远程主机信息

| 项目 | 值 |
|------|-----|
| IP | `46.224.225.164` |
| SSH | `ssh -p 2222 haiwei@46.224.225.164` |
| Tailscale | `clawdbot.tail297e45.ts.net` |
| Gateway Port | 18789 (loopback) |
| Teams Webhook | 3978 (via Tailscale Funnel) |

## 连接远程主机

```bash
# 标准 SSH 连接（需要 1Password SSH Agent 密钥）
ssh -p 2222 haiwei@46.224.225.164
```

## 检查主机状态

```bash
# Gateway 状态
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot status"

# 实时日志
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot logs -f"

# 重启 Gateway
ssh -p 2222 haiwei@46.224.225.164 "sudo XDG_RUNTIME_DIR=/run/user/0 systemctl --user restart clawdbot-gateway"
```

## Pairing 管理

### 两套 Pairing 系统

| 类型 | 适用场景 | CLI 命令 | 触发条件 |
|------|---------|---------|---------|
| **Device Pairing** | Web Chat（浏览器设备） | `clawdbot devices` | 新浏览器 / 清 localStorage / 换设备 |
| **Channel Pairing** | Teams / WhatsApp（渠道用户） | `clawdbot pairing` | 新用户首次私聊 bot |

### Device Pairing（Web Chat）

Web Chat 使用 Supabase Auth（用户身份） + Gateway Device Pairing（设备授权）双层认证。
用户看到 `Authorization required. Your pairing code: XXXXXXXX` 时，执行以下操作：

```bash
# 列出设备（pending + paired）
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot devices list"

# 批准（用 devices list 输出的 Request 列 UUID）
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot devices approve <requestId>"
```

> **注意**：pairing code（如 `d7f18b33`）是 deviceId 前缀，不能直接用于 approve 命令。
> 必须用 `devices list` 中显示的完整 requestId（UUID 格式）。
> 如果 approve 报 `unknown requestId`，说明 Gateway 内存中没有该请求（WebSocket 已断开），
> 让用户刷新页面重新连接，再立即执行 approve。

### Channel Pairing（Teams / WhatsApp 新成员）

```bash
# 列出待批准的配对请求
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot pairing list msteams"

# 批准配对
ssh -p 2222 haiwei@46.224.225.164 "sudo clawdbot pairing approve msteams <code>"
```

## 技术文档查询

需要 Clawdbot 技术文档时，使用 `/tool-clawdbot` skill：

- Gateway 配置和架构
- Channel 设置 (Teams, WhatsApp, Web)
- Node 和 Plugin 开发
- 故障排查

示例查询：
- "clawdbot pairing 机制是如何工作的"
- "如何配置 Teams channel"
- "Gateway WebSocket API 格式"

## 当前部署状态

| 组件 | 状态 |
|------|------|
| VPS (Hetzner) | ✅ 运行中 |
| Clawdbot Gateway | ✅ systemd 运行 |
| WhatsApp | ✅ 已连接 |
| Teams 配置 | ✅ 已配置 |
| Tailscale Funnel | ✅ 运行中 |
| Teams App 权限 | ❌ 等待 Admin |

## 安全提醒

- SSH 端口已改为 2222，root 登录已禁用
- 启用了 UFW + fail2ban
- 不要分享 SSH 密钥或 config 中的 token/secret
