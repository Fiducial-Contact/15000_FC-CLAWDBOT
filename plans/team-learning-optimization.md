# Plan: Team Agent 学习系统优化

## 诊断：为什么 per-user 学习从未触发

| 指标 | 值 | 含义 |
|------|-----|------|
| `userLearning.lastScanAt` | `2026-01-29T20:01:00Z` | 心跳扫描**在运行** |
| `userLearning.usersUpdated` | `[]` | 但**没更新任何人** |
| `selfReview.totalMissLogged` | `0` | 自审从未记录过错误 |
| `memory/users/msteams/` | 空 | Teams 还没有真正对话 |
| `memory/users/webchat/` | 只有 `default.tasks.json` | 只测试过 tasks |
| `memory/users/whatsapp/` | 只有 `+447776978063.tasks.json` | Haiwei 测试过 |

**根因**：Teams admin 审批未完成 → 团队成员还没真正使用 → 没有对话数据 → 学习扫描空转。

**但更深层的问题是**：即使有对话，当前协议也不够主动。它只定义了触发条件（remember/重复/纠正），没有主动创建初始 profile 的机制。

---

## 改造目标

把团队学习从"被动等触发"升级为"主动观察 + 渐进学习"：

1. **团队成员首次对话时，立即创建初始 profile**（不等 remember 命令）
2. **心跳学习扫描有具体可执行的动作**（不是空转）
3. **4 个学习维度**（适配团队场景，不是 opus 的 8 维度）
4. **数据边界清晰**（什么能学，什么不能学）
5. **学习结果直接改善回答质量**（不是生成报告）

---

## Phase 1: 补齐基础（VPS 文件修改）

### 1.1 修改 `/root/clawd/HEARTBEAT.md`

**当前问题**：心跳扫描步骤是"Scan memory/users/ and update per-user understanding"，太模糊。

**改为**：

```markdown
## 1) Team Member Learning (every heartbeat)

### Step 1: Profile existence check
For each provider dir under `memory/users/`:
- List all files
- If a `<senderId>.tasks.json` or `<senderId>.md` exists but NO `<senderId>.profile.json`:
  → Create initial profile from available context (name from session, provider from path)
  → Set `learnedContext: ["new-user-needs-observation"]`

### Step 2: Conversation scan
For each user with a profile:
- Read recent messages in their session (if accessible via session_status or daily logs)
- Look for:
  1. Software mentioned (AE, Premiere, DaVinci, Figma, etc.) → update `software[]`
  2. Language used → update `preferences.language`
  3. Question complexity → infer `preferences.responseStyle`
  4. Repeated topics → update `frequentTopics[]`
- Only update if confidence >= 2 observations

### Step 3: Staleness check
- If any profile's `lastUpdated` > 7 days old AND user has been active:
  → Re-scan their recent interactions
  → Update or confirm existing profile data
```

### 1.2 新建 `/root/clawd/TEAM-LEARNER.md`

团队版本的 RESEARCHER.md，定义 4 个学习维度：

```markdown
# Team Learner Protocol

## Learning Dimensions (rotate 1 per heartbeat)

### D1: Technical Profile
What software/tools does this person use? What's their skill level?
- Signals: questions asked, shortcuts known, error descriptions
- Store in: profile.json → software[], frequentTopics[]

### D2: Communication Style
How does this person prefer to receive answers?
- Signals: follow-up questions (too brief?), "thanks" patterns, language choice
- Store in: profile.json → preferences.responseStyle, preferences.language

### D3: Work Patterns
When are they active? What projects are they on?
- Signals: message timestamps, project names mentioned, deadline mentions
- Store in: <senderId>.md → work pattern notes

### D4: Unresolved Items
Did they ask something we couldn't fully answer? Did they drop a topic?
- Signals: "I'll figure it out", topic changes, no follow-up after complex answer
- Store in: <senderId>.tasks.json → follow-up items

## Rotation
Track in `memory/team-learning-state.json`:
{
  "nextDimension": 1,
  "lastRotatedAt": "...",
  "perUser": {
    "<senderId>": {
      "d1_lastChecked": "...",
      "d2_lastChecked": "...",
      "d3_lastChecked": "...",
      "d4_lastChecked": "..."
    }
  }
}

## Rules
- Learn silently. Never ask probing questions.
- 2+ observations before storing as preference.
- Admin (Haiwei) can see all profiles. Members cannot see each other's.
- Don't store: salary, personal life, health, political views.
```

### 1.3 新建 `/root/clawd/memory/team-data-allowlist.md`

```markdown
# Team Data Allowlist

## Can Learn (per user)
- Software/tools used
- Preferred response language
- Communication style (concise/detailed)
- Frequent question topics
- Active projects (mentioned in conversation)
- Timezone (from message patterns)
- Role and specialization

## Cannot Learn / Store
- Personal life details
- Salary or compensation
- Health information
- Political or religious views
- Client-specific financial data
- Passwords or credentials
- Private conversations with other team members

## Can Aggregate (admin-only)
- Most common team questions → improve FAQ
- Average response satisfaction → improve prompts
- Tool usage distribution → inform training priorities
```

### 1.4 修改 `/root/clawd/AGENTS.md` — Team Member Learning section

在现有 "Team Member Learning" section 末尾添加：

```markdown
### First Contact Protocol
When a NEW user sends their first DM:
1. Create `memory/users/<provider>/<senderId>.profile.json` immediately
2. Pre-fill from team directory (workspace/team/AGENTS.md → Team Members table)
3. Set `learnedContext: ["first-contact"]`
4. Respond normally — don't announce "I'm creating your profile"
5. After the conversation, update profile with observed preferences

### Active Learning (not just triggers)
Don't wait for explicit "remember" commands. Observe naturally:
- 3+ AE questions → add "AE" to software, "ae-expressions" to frequentTopics
- Consistent Chinese messages → set language: "zh"
- Short replies preferred → set responseStyle: "concise"
- Always verify with 2+ data points before storing
```

### 1.5 更新 `/root/clawd/memory/users/README.md`

添加初始 profile 模板和 first-contact 说明。

---

## Phase 2: 预填充团队档案

### 2.1 从 team/AGENTS.md 提取已知成员信息

基于 workspace/team/AGENTS.md 中的 Team Members 表，预创建 profile：

```
memory/users/msteams/haiwei.profile.json     → role: AI Engineer, language: zh/en
memory/users/msteams/eamonn.profile.json     → role: MD, language: en
memory/users/msteams/anand.profile.json      → role: Motion Design, software: [AE]
memory/users/msteams/steve.profile.json      → role: AI Strategy, language: en
```

**注意**：文件名需要使用实际 Teams AAD Object ID（等 Teams 审批通过后从第一次对话获取），暂时用占位名。

### 2.2 创建 team-learning-state.json

```json
{
  "nextDimension": 1,
  "lastRotatedAt": null,
  "perUser": {}
}
```

---

## Phase 3: 心跳协议升级

### 3.1 修改 HEARTBEAT.md 完整版

```markdown
# Team Heartbeat Protocol

Work hours: 09:00-17:30 (UK)
Cadence: every 3 hours
After-hours: daily 20:00 maintenance check

## 1) Team Member Learning (every heartbeat)

Read `TEAM-LEARNER.md` for the full protocol.

Quick checklist:
1. Check `memory/team-learning-state.json` → get `nextDimension`
2. For each active user (has files under memory/users/):
   a. Read their profile.json
   b. Apply current dimension's observation lens
   c. If new data found → update profile, set lastUpdated
3. Rotate dimension: nextDimension = (current % 4) + 1
4. Update team-learning-state.json

## 2) Self-Review (every 2 heartbeats ≈ 6h)

Check heartbeat-state.json → selfReview.lastCheckAt.

Three questions:
1. Which answer sounded correct but wasn't actually helpful?
2. Did I assume a team member's skill level incorrectly?
3. Did I miss a chance to learn user preferences?

Log to memory/self-review.md with TAG/MISS/FIX format.

## 3) System Health (daily 17:00-17:30 or 20:00 cron)

1. `clawdbot status` (channel health)
2. `clawdbot pairing list msteams` (pending approvals)
3. Profile staleness check: any profile > 7 days without update + user active?
4. Notify Haiwei if issues exist

## What NOT to do
- Don't proactively message team members during heartbeat
- Don't ask team members about their preferences
- Heartbeat is for internal learning and maintenance only
```

---

## Phase 4: 观察层（可选，后续迭代）

### 4.1 扩展 activity-observer.py

如果 opus 的 observer 已部署，可以添加 work agent 的 session 监控：
- 在 Notion 数据库中添加 `agent_type: "work"` 字段
- 跟踪每个团队成员的交互频率、问题类型、满意度信号
- 异常检测：某成员突然停止使用 → 可能遇到了问题

**这是 Phase 4，不在首次部署范围内。**

---

## 实施顺序

| 步骤 | 文件 | 操作 | 依赖 |
|------|------|------|------|
| 1 | `/root/clawd/TEAM-LEARNER.md` | **新建** | 无 |
| 2 | `/root/clawd/memory/team-data-allowlist.md` | **新建** | 无 |
| 3 | `/root/clawd/memory/team-learning-state.json` | **新建** | 无 |
| 4 | `/root/clawd/HEARTBEAT.md` | **重写** | 步骤 1 |
| 5 | `/root/clawd/AGENTS.md` | **追加** First Contact + Active Learning | 无 |
| 6 | `/root/clawd/memory/users/README.md` | **更新** | 无 |
| 7 | 预填充 team profiles | **新建** 占位 profiles | 步骤 1-6 |

**步骤 1-3 可并行，步骤 4 依赖步骤 1，步骤 5-7 可在 4 之后并行。**

---

## 验证方法

| 检查项 | 方法 |
|--------|------|
| 文件创建正确 | `ls -laR /root/clawd/memory/` |
| HEARTBEAT.md 语法正确 | agent 读取不报错 |
| 心跳扫描有动作 | 等下次心跳 → 检查 `heartbeat-state.json` 的 `usersUpdated` |
| First Contact 触发 | 发一条 webchat 测试消息 → 检查是否自动创建 profile |
| Profile 格式正确 | `cat memory/users/webchat/<id>.profile.json \| jq .` |
| 自审有记录 | 等 6h → 检查 `self-review.md` 有新条目 |
| 维度轮转工作 | 连续 4 次心跳后，`nextDimension` 应回到 1 |

---

## 范围

- **新建文件**: 3 个 (TEAM-LEARNER.md, team-data-allowlist.md, team-learning-state.json)
- **修改文件**: 3 个 (HEARTBEAT.md, AGENTS.md, README.md)
- **预填充文件**: 4 个占位 profile (等 Teams ID 确认后更新)
- **总计**: ~10 个文件操作
- **风险**: 低（只涉及 workspace 配置文件，不改代码）
