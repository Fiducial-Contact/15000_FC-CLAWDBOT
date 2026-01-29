---
name: Fix Build Errors
description: Run comprehensive error checks and fix all issues
category: Development
tags: [build, typescript, eslint, fix]
---

# Fix Build Errors

> **⚠️ 必备要求**：本项目构建必须使用 **Node 20.19.5**（见 `.nvmrc`）+ pnpm ≥9。使用其他 Node 版本会导致构建失败。

```bash
# 验证 Node 版本（必须！）
node -v  # 必须显示 v20.19.5

# 如果版本不对，使用 nvm 切换
nvm install 20.19.5
nvm use 20.19.5
nvm alias default 20.19.5
```

## 最快路径（推荐本地循环）

```bash
# 一次性跑完：类型检查 + ESLint 自动修复 + 构建
pnpm typecheck \
  && pnpm lint --fix \
  && pnpm build
```

- `typecheck` 先找类型/路由问题，最快；
- `lint --fix` 自动解决可修复的 ESLint 问题；
- `build` 做一次完整生产构建；**提交/上线前仍需跑一次完整 `pnpm build` 确保和 CI/Vercel 一致**。

## 检查策略（从快到全）

```bash
# 1. 快速类型检查 (~10s)
pnpm typecheck

# 2. 代码质量检查 (~15s)
pnpm lint

# 3. 完整生产构建 (~2-5min) ⭐ 提交前必跑
pnpm build
```

**推荐方法**：日常循环用“最快路径”命令（上方三合一），提交前再补一次完整构建以对齐 Vercel。

## 常见错误及解决方案

### 1. Supabase 类型推断问题
```typescript
// 使用 @ts-expect-error 而非 as any
// @ts-expect-error - table_name type not generated in database.types.ts
const { data } = await supabase.from('table_name').insert(data);
```

### 2. 变量提升 / 时序死区
```typescript
// ✅ 先声明，后使用
const myVar = 123;
const result = useMemo(() => myVar, [myVar]);
```

### 3. 可选字段处理
```typescript
// 方案 A: 可选字段
interface Data { field?: string; }

// 方案 B: 默认值
const value = data.field ?? 'default';
```

### 4. 缺失依赖
```bash
pnpm add <package-name>
```

### 5. 联合类型
```typescript
// ✅ 使用精确的联合类型
type Status = 'pending' | 'success' | 'error';
```

## 修复流程

1. **运行完整构建**并保存日志
   ```bash
   pnpm build 2>&1 | tee build-errors.log
   ```

2. **逐个修复错误**（不要一次修复所有，会有级联错误）
   - 修复第一个错误
   - 重新构建
   - 继续下一个

3. **验证修复**
   ```bash
   pnpm build  # 构建成功
   pnpm dev    # 开发模式正常
   ```

## 最佳实践

### ✅ DO
- 使用 `@ts-expect-error` 而非 `as any`
- 修复根本原因而非绕过类型检查
- 提交前运行完整构建

### ❌ DON'T
- 使用 `as any`（违反 ESLint 规则）
- 跳过生产构建检查
- 提交无法构建的代码

## 提交前检查清单

- [ ] `pnpm build` 成功
- [ ] 无类型错误和 ESLint 错误
- [ ] 新依赖已添加到 package.json
- [ ] 提交信息清晰说明修复内容

## 故障排除

### Node 版本问题（高优先级）⚠️

**症状**：构建时出现 `Unexpected end of JSON input` 错误，通常在多个 API 路由上重复出现

**原因**：Next.js 16 + React 19 需要 **Node 20.19.5**（见项目根目录 `.nvmrc`），不支持 Node 23 或其他版本

**解决方案**：

**选项 A：切换到 Node 20.19.5（强烈推荐）**
```bash
# 使用 nvm（推荐）
nvm install 20.19.5
nvm use 20.19.5
nvm alias default 20.19.5

# 或使用 Homebrew
brew uninstall node
brew install node@20
brew link node@20 --force --overwrite

# 验证版本（必须是 20.19.5）
node -v  # 必须显示 v20.19.5
```

**选项 B：直接 Vercel 构建（最简单）**
```bash
# 如果本地 Node 版本不对，直接 push 到 Vercel
git add .
git commit -m "your changes"
git push

# Vercel 会自动使用正确的 Node 20 版本构建 ✅
```

### 其他常见问题

```bash
# 清理缓存
rm -rf .next

# 重装依赖
pnpm install

# 检查版本（必须严格匹配）
node -v  # 必须是 v20.19.5（见 .nvmrc）
pnpm -v
```

如果看到 "Unused @ts-expect-error"，说明错误已在其他地方修复，删除该注释即可。

---

**核心理念**：
- **本地 Node 20.19.5** = 本地构建成功 = Vercel 部署成功 🎯
- **本地其他版本（如 Node 23）** = 构建失败 → 必须切换版本或直接 Vercel 构建 ⚠️
- **项目标准版本见 `.nvmrc`**，严格遵守避免构建问题
