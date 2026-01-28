## 执行顺序说明

```
┌─────────────────────────────────────────────────────────────┐
│  Part A (功能卡片)  ←──────┬──────→  Part B (消息渲染)      │
│  可并行                    │         可并行                  │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Part C (聊天控制)            │
              │  依赖: Gateway client 修改    │
              └──────────────────────────────┘
```

**并发策略：** Part A 和 Part B 完全独立，可以并发执行。Part C 需要等 client 层修改完成。

---

## Part A: 功能卡片对齐

**可独立执行，优先级: P1**

- [ ] A.1 SSH 到 VPS 确认已安装的 Skills
  ```bash
  ssh root@46.224.225.164 "clawdbot skills list"
  ```
- [ ] A.2 更新 `CAPABILITY_CATEGORIES` 数据，移除/标记不支持的功能
  - 文件: `src/app/chat/ChatClient.tsx:32-127`
- [ ] A.3 添加 "Coming Soon" 标签样式到 CapabilityCard
  - 文件: `src/components/CapabilityCard.tsx`
- [ ] A.4 TypeScript 检查通过

---

## Part B: 消息渲染增强

**可独立执行，优先级: P0**

- [x] B.1 安装 react-markdown 和代码高亮依赖
  ```bash
  pnpm add react-markdown remark-gfm rehype-highlight
  ```
- [x] B.2 更新 ChatMessage 组件支持 Markdown 渲染
  - 文件: `src/components/ChatMessage.tsx`
  - 功能: 代码块、列表、链接、表格
- [x] B.3 添加复制消息按钮
  - 文件: `src/components/ChatMessage.tsx`
  - 功能: 点击复制整条消息内容
- [x] B.4 添加代码块复制按钮
  - 功能: 单独复制代码块内容
- [x] B.5 添加必要的 CSS 样式
  - 文件: `src/app/globals.css`
- [x] B.6 TypeScript 检查通过

---

## Part C: 聊天控制增强

**依赖 Gateway client，优先级: P0**

- [x] C.1 在 `GatewayClient` 添加 `abortChat` 方法
  - 文件: `src/lib/gateway/client.ts`
  - API: `chat.abort` with `sessionKey`
- [x] C.2 在 `useGateway` hook 暴露 `abortChat` 方法
  - 文件: `src/lib/gateway/useGateway.ts`
- [x] C.3 在 ChatInput 添加 Stop 按钮
  - 文件: `src/components/ChatInput.tsx`
  - 条件: `isLoading` 时显示
- [x] C.4 连接 Stop 按钮到 abort 逻辑
  - 文件: `src/app/chat/ChatClient.tsx`
- [x] C.5 TypeScript 检查通过
- [ ] C.6 手动测试 abort 功能

---

## 验证清单

- [x] `pnpm tsc --noEmit` 无错误
- [x] `pnpm build` 成功
- [ ] `pnpm dev` 正常启动
- [ ] 功能卡片显示正确
- [ ] Markdown 渲染正常（代码块、列表、链接）
- [ ] 复制按钮工作正常
- [ ] Stop 按钮能中止 AI 响应
