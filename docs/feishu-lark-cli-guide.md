# 飞书 CLI（lark-cli）使用说明

> **文档定位**：本文档面向两类读者——
> 1. **普通用户**：快速看懂 lark-cli 能做什么，5 分钟上手
> 2. **AI Agent**：根据本文档可直接执行相关操作，无需额外上下文

---

## 一、CLI 简介

### 1.1 什么是 lark-cli？

`lark-cli` 是飞书官方提供的命令行工具（Command Line Interface）。简单来说，就是你坐在终端前，敲一行命令，就能完成原本需要打开飞书 App 或网页才能做的事。

**一句话价值**：把「打开飞书 → 找到功能 → 点击操作」变成「一行命令直接搞定」。

### 1.2 能做什么？

| 场景 | 一句话说明 |
|------|-----------|
| 📄 **文档** | 创建、搜索、编辑飞书文档（不用打开网页） |
| 📅 **日历** | 查看今日日程、创建会议、查忙闲状态 |
| 💬 **消息** | 给同事/群聊发送消息、传文件 |
| ✅ **任务** | 创建待办、查看待处理任务 |
| 📊 **多维表格** | 建表、读写记录、查数据 |
| 📁 **云盘** | 上传/下载文件、管理文件夹 |
| 👥 **通讯录** | 查组织架构、搜员工信息 |
| 📧 **邮件** | 发邮件、查收件箱、管理草稿 |
| 🤖 **Agent 自动化** | AI Agent 直接操作飞书资源，实现无人值守任务 |

### 1.3 两种身份

lark-cli 支持两种身份操作，适用场景不同：

| 身份 | 说明 | 适用场景 |
|------|------|---------|
| **User（用户身份）** | 以你的个人名义操作 | 访问你的日历、文档、邮件等个人资源 |
| **Bot（应用身份）** | 以应用名义操作 | 发消息到群聊、自动同步数据等机器任务 |

> 💡 **新手建议**：先用 **User 身份**体验，需要自动化时再切 **Bot 身份**。

---

## 二、部署方式

### 2.1 环境要求

- Node.js >= 16.x
- npm >= 8.x（随 Node.js 自带）

### 2.2 安装

```bash
# 通过 npm 全局安装（推荐）
npm install -g @larksuiteoapi/lark-cli

# 验证安装成功
lark-cli --version
```

### 2.3 初始化配置

首次使用需要配置飞书应用信息：

```bash
# 初始化配置（会提示输入 AppID 和 AppSecret）
lark-cli config init
```

**配置参数说明**：

| 参数 | 获取位置 | 说明 |
|------|---------|------|
| `AppID` | [飞书开放平台](https://open.feishu.cn) → 你的应用 → 凭证与基础信息 | 应用唯一标识 |
| `AppSecret` | [飞书开放平台](https://open.feishu.cn) → 你的应用 → 凭证与基础信息 | 应用密钥 |

配置完成后，可以用以下命令查看当前配置：

```bash
lark-cli config show
```

### 2.4 认证登录

#### 用户身份（User）—— 推荐使用

User 身份可以访问你的个人资源（日历、文档、任务等）。登录方式为 **Device Flow**（设备授权流程）：

```bash
# 方式一：按业务域授权（推荐，自动包含该域所有权限）
lark-cli auth login --domain docs

# 常用 domain 选项：
#   docs    - 文档相关
#   calendar - 日历相关
#   im      - 消息相关
#   task    - 任务相关
#   drive   - 云盘相关
#   contact - 通讯录相关
#   all     - 所有权限

# 方式二：按具体 scope 授权（最小权限原则）
lark-cli auth login --scope "docx:document:write_only docx:document:readonly"
```

执行后会在终端输出一个授权链接，**在浏览器中打开并点击「授权」**即可完成登录。

#### Bot 身份

Bot 身份无需登录，只要配置了 `AppID` 和 `AppSecret` 即可使用。适用于：
- 自动发送群消息
- 批量数据处理
- 无需用户个人资源的场景

使用方式：在命令后加 `--as bot`

```bash
lark-cli im message create --receive-id <群ID> --msg-type text --content "消息内容" --as bot
```

#### 查看当前登录状态

```bash
lark-cli auth status
```

---

## 三、核心功能速查

### 3.1 文档（Docs）

```bash
# 🔍 搜索文档
lark-cli docs +search --query "项目周报"

# ➕ 创建新文档
lark-cli docs +create --title "项目启动会纪要"

# 📖 查看文档内容
lark-cli docs +fetch --doc "文档URL或token"

# ✏️ 更新文档内容
lark-cli docs +update --doc "文档URL或token" --mode overwrite --markdown "# 标题\n内容"

# 🖼️ 在文档末尾插入图片/文件
lark-cli docs +media-insert --doc "文档token" --file /path/to/image.png
```

**更新模式说明**：

| 模式 | 说明 |
|------|------|
| `overwrite` | 覆盖整个文档 |
| `append` | 在文档末尾追加 |
| `replace_range` | 替换指定范围内容 |
| `insert_before` | 在指定内容前插入 |
| `insert_after` | 在指定内容后插入 |

### 3.2 日历（Calendar）

```bash
# 📅 快速查看今日/近期日程
lark-cli calendar +agenda

# 🔍 查看特定日历的事件列表
lark-cli calendar events list --params '{"calendar_id":"primary"}'

# ➕ 创建日程（邀请参会人）
lark-cli calendar create --summary "项目周会" \
  --start-time "2024-06-01T10:00:00+08:00" \
  --end-time "2024-06-01T11:00:00+08:00" \
  --attendees "user_open_id_1,user_open_id_2"

# 🕐 查询某人忙闲状态
lark-cli calendar +freebusy --user-id "user_open_id"

# 💡 获取时间推荐（适合不确定时间的会议）
lark-cli calendar +suggestion --duration 60 --attendees "user1,user2"
```

### 3.3 即时通讯（IM）

```bash
# 💬 发送文本消息
lark-cli im message create \
  --receive-id "chat_id或user_id" \
  --receive-id-type "chat_id" \
  --msg-type text \
  --content '{"text":"你好，这是一条测试消息"}'

# 📎 发送带文件的消息（先上传文件获取 key）
# 第一步：上传文件
lark-cli drive file upload --file /path/to/file.pdf
# 第二步：发送文件消息（使用上一步返回的 file_key）
lark-cli im message create \
  --receive-id "chat_id" \
  --receive-id-type "chat_id" \
  --msg-type file \
  --content '{"file_key":"file-xxx-xxx"}'

# 👥 查看群成员
lark-cli im chat members --params '{"chat_id":"chat_xxx"}'

# 🔍 搜索聊天记录
lark-cli im message search --query "关键词"
```

**receive-id-type 说明**：

| 类型 | 说明 |
|------|------|
| `chat_id` | 群聊 ID |
| `open_id` | 用户 open_id |
| `user_id` | 用户 user_id |
| `union_id` | 用户 union_id |
| `email` | 用户邮箱 |

### 3.4 任务（Task）

```bash
# ✅ 查看我的任务列表
lark-cli task +get-my-tasks

# ➕ 创建任务
lark-cli task create \
  --summary "完成项目文档" \
  --due-time "2024-06-30T18:00:00+08:00" \
  --followers "user_open_id_1"

# 📋 创建任务清单
lark-cli task list create --name "本周待办"

# ✔️ 更新任务状态
lark-cli task update --task-id "task_xxx" --completed
```

### 3.5 多维表格（Base）

```bash
# 📊 创建多维表格
lark-cli base create --name "项目数据表"

# ➕ 添加字段（列）
lark-cli base field create --app-token "app_xxx" --table-id "tbl_xxx" \
  --field-type text --field-name "项目名称"

# 📝 添加记录（行）
lark-cli base record create --app-token "app_xxx" --table-id "tbl_xxx" \
  --fields '{"项目名称":"AI 项目","状态":"进行中"}'

# 🔍 查询记录
lark-cli base record list --app-token "app_xxx" --table-id "tbl_xxx"
```

### 3.6 云盘（Drive）

```bash
# 📁 创建文件夹
lark-cli drive folder create --name "项目资料" --parent-folder "folder_xxx"

# ⬆️ 上传文件
lark-cli drive file upload --file /path/to/document.pdf

# ⬇️ 下载文件
lark-cli drive file download --file-token "file_xxx" --output ./download/

# 🗑️ 删除文件
lark-cli drive file delete --file-token "file_xxx"
```

### 3.7 通讯录（Contact）

```bash
# 🔍 搜索员工
lark-cli contact +search-user --query "张三"

# 📋 获取当前用户信息
lark-cli contact user get --user-id "me"

# 🏢 获取部门列表
lark-cli contact department list

# 👥 获取部门成员
lark-cli contact department users --department-id "0" --page-size 100
```

### 3.8 邮件（Mail）

```bash
# ✉️ 发送邮件
lark-cli mail send \
  --to "recipient@example.com" \
  --subject "项目周报" \
  --body "本周进展..."

# 📥 查看收件箱
lark-cli mail inbox list

# 🔍 搜索邮件
lark-cli mail search --query "项目"

# 📄 查看邮件详情
lark-cli mail read --message-id "msg_xxx"
```

### 3.9 视频会议（VC）

```bash
# 🔍 搜索会议记录
lark-cli vc meeting list --start-time "2024-06-01" --end-time "2024-06-30"

# 📝 获取会议纪要
lark-cli vc minutes get --meeting-id "meeting_xxx"
```

---

## 四、Shortcuts 速查表

lark-cli 提供了一批 **Shortcut 命令**（以 `+` 开头），是对常用操作的高级封装，**推荐优先使用**：

| 功能域 | Shortcut | 说明 |
|--------|---------|------|
| 文档 | `docs +search` | 搜索文档 |
| 文档 | `docs +create` | 创建文档 |
| 文档 | `docs +fetch` | 获取文档内容 |
| 文档 | `docs +update` | 更新文档 |
| 文档 | `docs +media-insert` | 插入媒体文件 |
| 日历 | `calendar +agenda` | 查看近期日程 |
| 日历 | `calendar +freebusy` | 查忙闲状态 |
| 日历 | `calendar +suggestion` | 时间推荐 |
| 通讯录 | `contact +search-user` | 搜索用户 |
| 任务 | `task +get-my-tasks` | 获取我的任务 |
| 任务 | `task +create-quick` | 快速创建任务 |
| IM | `im +send` | 快速发送消息 |

---

## 五、面向 Agent 的执行参考

当 AI Agent 需要根据本文档执行飞书操作时，遵循以下规范：

### 5.1 执行前检查清单

```bash
# 1. 确认 lark-cli 已安装
lark-cli --version

# 2. 确认配置已完成
lark-cli config show

# 3. 确认已登录（用户身份）
lark-cli auth status

# 4. 如需 Bot 身份，确认应用权限已开通
lark-cli auth scopes
```

### 5.2 身份选择原则

| 场景 | 推荐身份 | 原因 |
|------|---------|------|
| 操作用户个人文档/日历/任务 | `--as user` | 需要访问用户个人资源 |
| 发送群消息/自动化通知 | `--as bot` | 不需要用户个人资源 |
| 创建属于用户的文档 | `--as user` | 文档归属用户 |
| 批量数据处理 | `--as bot` | 机器任务，无需用户介入 |

### 5.3 通用 API 调用方式

对于 Shortcut 未覆盖的 API，可以使用通用 `api` 命令：

```bash
# GET 请求
lark-cli api GET /open-apis/calendar/v4/calendars/primary/events \
  --params '{"page_size":50}'

# POST 请求
lark-cli api POST /open-apis/im/v1/messages \
  --params '{"receive_id_type":"chat_id"}' \
  --data '{
    "receive_id": "chat_xxx",
    "msg_type": "text",
    "content": "{\"text\":\"Hello\"}"
  }'

# PATCH 请求（更新）
lark-cli api PATCH /open-apis/calendar/v4/calendars/primary/events/event_xxx \
  --data '{"summary":"更新后的标题"}'

# DELETE 请求（删除）
lark-cli api DELETE /open-apis/calendar/v4/calendars/primary/events/event_xxx
```

### 5.4 查看 API 参数说明

不确定某个 API 需要什么参数？用 `schema` 命令查看：

```bash
# 查看某个 API 的完整参数定义
lark-cli schema calendar.events.list --format pretty

# 查看某个 API 需要什么权限（scope）
lark-cli schema im.message.create --format pretty
```

### 5.5 分页处理

查询列表类 API 时，数据可能分页：

```bash
# 自动分页获取所有数据（推荐）
lark-cli contact department users --department-id "0" --page-all

# 限制分页数量
lark-cli contact department users --department-id "0" --page-all --page-limit 5

# 自定义分页大小
lark-cli contact department users --department-id "0" --page-size 200 --page-all
```

### 5.6 输出格式

```bash
# JSON 格式（默认）
lark-cli calendar +agenda

# 表格格式（适合人类阅读）
lark-cli calendar +agenda --format table

#  pretty 格式（缩进美化）
lark-cli calendar +agenda --format pretty

# CSV 格式（导出到 Excel）
lark-cli base record list --app-token "app_xxx" --table-id "tbl_xxx" --format csv

# 保存到文件
lark-cli calendar +agenda --format json -o ./agenda.json
```

### 5.7 错误处理指南

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `command not found: lark-cli` | CLI 未安装或未加入 PATH | `npm install -g @larksuiteoapi/lark-cli` |
| `need_user_authorization` | 用户未登录或 Token 过期 | 执行 `lark-cli auth login --domain docs` |
| `forbidden` / `permission denied` | 应用未开通对应权限 | 去飞书开放平台后台开通 scope |
| `invalid app_id or app_secret` | 配置信息错误 | 检查 `lark-cli config show` 中的配置 |
| `chat not found` | 群聊 ID 错误或机器人未加入群聊 | 确认 chat_id 正确，Bot 已加入群 |
| `user not found` | 用户 ID 错误 | 通过 `contact +search-user` 查询正确的 open_id |
| `document not found` | 文档 token 错误 | 确认 doc_token 正确，或通过 `docs +search` 查找 |

### 5.8 权限不足处理流程

遇到权限错误时：

1. **查看错误信息中的 `console_url`**，打开飞书开发者后台
2. **开通缺失的 scope**
3. **重新发布应用**
4. **如果是 User 身份，重新执行 `lark-cli auth login --scope "缺失的scope"`**

---

## 六、工作流程示例

### 场景一：每日站会报告（自动化）

```bash
# 1. 获取今日日程
lark-cli calendar +agenda

# 2. 获取我的待办任务
lark-cli task +get-my-tasks

# 3. 将结果写入文档
lark-cli docs +update --doc "doc_token" --mode append --markdown "## $(date +%Y-%m-%d) 站会纪要\n\n### 今日日程\n...\n\n### 待办任务\n..."

# 4. 发送提醒到群聊
lark-cli im message create \
  --receive-id "chat_xxx" \
  --receive-id-type "chat_id" \
  --msg-type text \
  --content '{"text":"今日站会报告已更新，请查看"}'
```

### 场景二：会议纪要整理

```bash
# 1. 搜索近期会议
lark-cli vc meeting list --start-time "2024-06-01" --end-time "2024-06-30"

# 2. 获取某场会议的纪要
lark-cli vc minutes get --meeting-id "meeting_xxx"

# 3. 创建新文档保存纪要
lark-cli docs +create --title "6月会议纪要的汇总"
```

### 场景三：批量数据录入多维表格

```bash
# 1. 确认表格存在
lark-cli base table list --app-token "app_xxx"

# 2. 批量添加记录
lark-cli base record create --app-token "app_xxx" --table-id "tbl_xxx" \
  --fields '{"姓名":"张三","部门":"技术部","入职日期":"2024-01-01"}'

lark-cli base record create --app-token "app_xxx" --table-id "tbl_xxx" \
  --fields '{"姓名":"李四","部门":"产品部","入职日期":"2024-03-01"}'
```

---

## 七、安装 AI Agent Skills（进阶）

如果你使用的是 Claude Code 等 AI 编码助手，可以安装飞书官方提供的 Skills，让 Agent 更智能：

```bash
# 安装所有飞书 Skills
npx skills add larksuite/cli --all -y

# 或只安装特定领域的 Skills
npx skills add larksuite/cli -s lark-calendar -y
npx skills add larksuite/cli -s lark-im -y
npx skills add larksuite/cli -s lark-docs -y
```

---

## 八、快速参考卡片

### 身份切换

```bash
lark-cli <command> --as user    # 用户身份
lark-cli <command> --as bot     # 应用身份
lark-cli <command> --as auto    # 自动选择（默认）
```

### 常用命令速查

| 任务 | 命令 |
|------|------|
| 搜索文档 | `lark-cli docs +search --query "关键词"` |
| 创建文档 | `lark-cli docs +create --title "标题"` |
| 发送消息 | `lark-cli im message create --receive-id <ID> --msg-type text --content '{"text":"内容"}'` |
| 查看日程 | `lark-cli calendar +agenda` |
| 创建日程 | `lark-cli calendar create --summary "标题" --start-time <时间> --end-time <时间>` |
| 查忙闲 | `lark-cli calendar +freebusy --user-id <ID>` |
| 创建任务 | `lark-cli task create --summary "标题" --due-time <时间>` |
| 查看任务 | `lark-cli task +get-my-tasks` |
| 搜索用户 | `lark-cli contact +search-user --query "姓名"` |
| 上传文件 | `lark-cli drive file upload --file <路径>` |
| 发送邮件 | `lark-cli mail send --to <邮箱> --subject <主题> --body <内容>` |

### 文档 Token 获取

Wiki 链接（如 `https://xxx.feishu.cn/wiki/CFnPw3WJQidBQdkXH4mczT2Gnqe`）中的 token 需要先转换：

```bash
lark-cli wiki spaces get_node --params '{"token":"CFnPw3WJQidBQdkXH4mczT2Gnqe"}'
# 返回中的 node.obj_token 才是真实文档 token
```

普通文档链接（如 `https://xxx.feishu.cn/docx/Sy7TdcybXoYh5ExGXRRcCHb4nDc`）中的 token 可直接使用。

---

> **文档版本**：v1.0  
> **更新时间**：2024-05-27  
> **适用范围**：飞书 CLI（lark-cli）v1.0.0+
