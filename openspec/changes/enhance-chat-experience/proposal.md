## Why

当前 WebChat UI 的功能卡片展示与 Gateway 实际支持的 Skills 不对齐，且缺少核心聊天功能（Markdown 渲染、复制消息、中止响应），导致用户体验断层。

## What Changes

### Part A: 功能卡片对齐 (capability-cards)
- 调整功能卡片显示逻辑，标记未完全支持的功能为 "Coming Soon"
- 移除 Voice 卡片（UI 不支持录音）
- 调整 Image Creation、Video Tools 卡片状态

### Part B: 消息渲染增强 (message-rendering)
- **ADDED**: Markdown 渲染（代码块、列表、链接）
- **ADDED**: 复制消息按钮
- **ADDED**: 代码语法高亮

### Part C: 聊天控制增强 (chat-interface)
- **ADDED**: 中止响应功能（调用 `chat.abort`）
- **MODIFIED**: 会话列表只显示 webchat 渠道
- **ADDED**: 主会话置顶显示

## Impact

- Affected specs: `chat-interface`, 新增 `message-rendering`, `capability-cards`
- Affected code:
  - `src/components/ChatMessage.tsx` (Markdown 渲染)
  - `src/components/ChatInput.tsx` (Stop 按钮)
  - `src/app/chat/ChatClient.tsx` (功能卡片、abort)
  - `src/lib/gateway/useGateway.ts` (abort 方法)
  - `src/lib/gateway/client.ts` (abort API)

## Dependencies

- Part A 和 Part B 可以**并行开发**
- Part C 的 `chat.abort` 需要先完成 client 层修改

## Verification

1. SSH 到 VPS 确认 Skills 列表：`clawdbot skills list`
2. 运行 `pnpm dev` 测试各功能
3. TypeScript 检查：`pnpm tsc --noEmit`
