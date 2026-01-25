# Microsoft Teams App 安装请求

> 发给 IT 管理员 / Teams Admin 的说明

---

## 概述

我需要在 Teams 中安装一个内部 AI 助手应用，用于提高团队工作效率。

**应用信息:**
- 名称: **Haiwei's Unpaid Intern**
- 用途: 内部 AI 助手（技术问答、简单任务）
- 安全: 仅连接公司 Azure 资源

---

## 方式一：管理员上传应用（推荐）

1. 登录 [Teams Admin Center](https://admin.teams.microsoft.com)
2. 左侧菜单 → **Teams apps** → **Manage apps**
3. 点击 **Upload new app**
4. 上传附件中的 `haiweis-unpaid-intern.zip`
5. 批准应用
6. 通知 Haiwei 已完成

---

## 方式二：允许用户上传自定义应用

1. 登录 [Teams Admin Center](https://admin.teams.microsoft.com)
2. 左侧菜单 → **Teams apps** → **Setup policies**
3. 选择 **Global (Org-wide default)** 或创建新策略
4. 启用 **Upload custom apps**
5. 保存并等待策略生效（可能需要几小时）

---

## 应用安全说明

| 项目 | 说明 |
|------|------|
| **数据存储** | 所有数据存储在公司 Azure 订阅内 |
| **AI 提供商** | Anthropic Claude（符合 SOC 2、GDPR） |
| **网络访问** | 仅通过 Azure Bot Framework |
| **权限范围** | 仅个人聊天和已授权的团队频道 |
| **审计** | 所有对话有日志记录 |

---

## Azure 资源信息（已创建）

| 资源 | 详情 |
|------|------|
| **订阅** | Azure subscription 1 |
| **资源组** | haiwei-stuff |
| **Bot 名称** | haiweis-unpaid-intern |
| **区域** | UK South |
| **定价层** | F0 (免费) |

[查看 Azure Bot 资源](https://portal.azure.com/#resource/subscriptions/13221145-58f1-45b8-83a2-53165c1f05c7/resourceGroups/haiwei-stuff/providers/Microsoft.BotService/botServices/haiweis-unpaid-intern)

---

## 联系方式

如有问题请联系：

**Haiwei**  
AI Visual Engineer  
Fiducial Communications

---

## 附件

- `haiweis-unpaid-intern.zip` - Teams App 安装包
