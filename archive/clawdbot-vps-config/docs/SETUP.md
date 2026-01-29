# Fiducial Clawdbot Setup (macOS)

目标: 在公司电脑上用最少维护把 Microsoft Teams DM 跑通。

优先看 `README.md` 的 “明天上公司电脑的最短路径”。这里是更详细版本。

## 前置要求

- macOS
- Node.js 22+
- Tailscale 账号
- Azure Bot 已创建并启用 Teams Channel

## 安装 Node.js 22+

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 22
nvm use 22
nvm alias default 22
node --version
```

## 安装 Clawdbot

```bash
npm install -g clawdbot@latest
clawdbot --version
```

## Profile + 配置

```bash
mkdir -p ~/.clawdbot-fiducial
cp ~/Projects/clawdbot/config/clawdbot.json ~/.clawdbot-fiducial/clawdbot.json
```

编辑 `~/.clawdbot-fiducial/clawdbot.json`:

- 更新 `agents.defaults.workspace` 为当前机器路径

## 配置 Anthropic

```bash
clawdbot --profile fiducial configure
```

## 安装 Teams 插件

```bash
clawdbot --profile fiducial plugins install @clawdbot/msteams
clawdbot --profile fiducial plugins list
```

如果遇到 `workspace:*` 依赖问题，按 README 的 workaround 修复。

## Tailscale Funnel

```bash
/Applications/Tailscale.app/Contents/MacOS/Tailscale login
/Applications/Tailscale.app/Contents/MacOS/Tailscale funnel 3978
```

把 Azure Bot 的 Messaging Endpoint 设置为:

```
https://<your-tailscale-host>.ts.net/api/messages
```

## 启动 + 验证

```bash
./start.sh

clawdbot --profile fiducial status
clawdbot --profile fiducial logs --follow
```

Web Chat / Teams 测试顺序参见 `README.md`。
