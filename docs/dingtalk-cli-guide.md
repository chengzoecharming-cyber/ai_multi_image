# 企业 IM CLI 工具使用说明

> **文档定位**：本文档面向两类读者——
> 1. **普通用户**：快速看懂 CLI 能做什么，不必深究细节
> 2. **AI Agent**：根据本文档可直接执行相关操作，无需额外上下文

---

## 一、CLI 简介

### 1.1 什么是 CLI？

CLI（Command Line Interface，命令行接口）工具允许通过终端直接调用企业 IM 平台的开放 API，无需打开网页或 App 即可完成日常管理任务。

**一句话价值**：把「打开网页 → 找到功能 → 点击操作」变成「一行命令直接搞定」。

### 1.2 适用场景

| 场景 | 一句话说明 |
|------|-----------|
| 消息通知 | CI/CD 流水线自动发构建结果到工作群 |
| 组织管理 | 批量查部门成员、员工信息 |
| 审批查询 | 自动拉审批状态，生成报表 |
| 日程管理 | 自动创建会议、邀请参会人 |
| Agent 自动化 | AI Agent 直接操作企业资源，实现无人值守任务 |

### 1.3 两大平台 CLI 概览

| 维度 | 钉钉 | 飞书（lark-cli） |
|------|------|-----------------|
| 核心方式 | **Open API + curl/SDK** | `lark-cli` 命令行工具 |
| 官方工具 | REST API / Node.js SDK | `npm install -g @larksuiteoapi/lark-cli` |
| 认证方式 | AppKey + AppSecret + AccessToken | Bot 身份 / User OAuth |
| 核心能力 | 消息、审批、通讯录、日程 | 文档、日历、任务、IM、多维表格 |

> **本文档当前版本**：详细覆盖 **钉钉 Open API**（以 curl 方式为主），飞书 CLI 部分标注「待补充」。

---

## 二、钉钉 Open API（CLI 方式）

### 2.1 简介

钉钉开放平台提供完善的 REST API，支持以下核心能力：

- **即时通讯**：发送文本/Markdown/卡片消息到群聊或个人
- **通讯录**：查询部门列表、部门成员、员工详情
- **审批管理**：查询审批实例、获取审批详情
- **日程管理**：创建日程、查询日程列表
- **群管理**：查询群成员、群信息
- **考勤管理**：查询打卡记录、统计报表

> **注意**：钉钉官方未提供类似飞书 `lark-cli` 的统一命令行工具。实际使用中，通常通过以下三种方式调用：
> 1. **curl** 直接调用 REST API（本文档主要方式，Agent 可直接执行）
> 2. **官方 SDK**（Java/Node.js/Python/PHP/Go）
> 3. **自研脚本** 封装常用命令

### 2.2 部署方式

#### 2.2.1 环境要求

- 已安装 `curl`（macOS/Linux 自带，Windows 可用 Git Bash）
- 已注册钉钉开放平台应用并获取 `AppKey` 和 `AppSecret`

#### 2.2.2 创建钉钉应用

1. 访问 [钉钉开放平台](https://open.dingtalk.com)
2. 进入「应用开发」→「企业内部开发」→「创建应用」
3. 记录以下信息：
   - `AppKey`（应用唯一标识）
   - `AppSecret`（应用密钥）

#### 2.2.3 配置 API 权限

在应用详情页的「权限管理」中，开通所需权限：

| 功能场景 | 所需权限 |
|---------|---------|
| 发送群消息 | `群会话信息读取权限`、`企业群消息权限` |
| 通讯录管理 | `通讯录部门信息读权限`、`通讯录部门成员读权限`、`成员信息读权限` |
| 审批管理 | `审批实例读权限`、`审批模板读权限` |
| 日程管理 | `日程读权限`、`日程写权限` |

> ⚠️ **注意**：权限开通后，需要发布应用才能生效。

#### 2.2.4 配置环境变量（推荐）

为便于 Agent 直接执行，建议将凭证配置为环境变量：

```bash
# ~/.bashrc 或 ~/.zshrc 中添加
export DINGTALK_APP_KEY="your-app-key"
export DINGTALK_APP_SECRET="your-app-secret"

# 使配置生效
source ~/.bashrc   # 或 source ~/.zshrc
```

### 2.3 使用举例（curl 方式）

#### 2.3.1 获取 AccessToken

所有钉钉 API 调用都需要 AccessToken，有效期 7200 秒：

```bash
# 获取 AccessToken
curl -s "https://oapi.dingtalk.com/gettoken?appkey=${DINGTALK_APP_KEY}&appsecret=${DINGTALK_APP_SECRET}" | jq -r '.access_token'

# 存入变量供后续使用
ACCESS_TOKEN=$(curl -s "https://oapi.dingtalk.com/gettoken?appkey=${DINGTALK_APP_KEY}&appsecret=${DINGTALK_APP_SECRET}" | jq -r '.access_token')
echo $ACCESS_TOKEN
```

#### 2.3.2 发送群消息

```bash
# 发送文本消息到群聊
curl -s "https://oapi.dingtalk.com/robot/send?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "chatid": "chatxxxxxxxxxxxxxxxx",
    "msg": {
      "msgtype": "text",
      "text": {"content": "构建成功：项目已部署到生产环境"}
    }
  }'

# 发送 Markdown 消息
curl -s "https://oapi.dingtalk.com/robot/send?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "chatid": "chatxxxxxxxxxxxxxxxx",
    "msg": {
      "msgtype": "markdown",
      "markdown": {
        "title": "部署通知",
        "text": "## 部署完成\n- 版本: v1.2.3\n- 时间: 2024-05-27 14:00"
      }
    }
  }'

# 发送 ActionCard 卡片消息
curl -s "https://oapi.dingtalk.com/robot/send?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "chatid": "chatxxxxxxxxxxxxxxxx",
    "msg": {
      "msgtype": "action_card",
      "action_card": {
        "title": "待处理审批",
        "markdown": "您有一条待审批的请假申请",
        "single_title": "查看详情",
        "single_url": "https://dingtalk.com"
      }
    }
  }'
```

#### 2.3.3 查询组织架构

```bash
# 获取部门列表
curl -s "https://oapi.dingtalk.com/department/list?access_token=${ACCESS_TOKEN}" | jq '.department'

# 获取部门成员（支持分页）
curl -s "https://oapi.dingtalk.com/user/listbypage?access_token=${ACCESS_TOKEN}&department_id=1&offset=0&size=100" | jq '.userlist'

# 获取员工详情
curl -s "https://oapi.dingtalk.com/user/get?access_token=${ACCESS_TOKEN}&userid=user001" | jq '.'

# 获取当前管理员通讯录权限范围
curl -s "https://oapi.dingtalk.com/auth/scopes?access_token=${ACCESS_TOKEN}" | jq '.'
```

#### 2.3.4 审批管理

```bash
# 查询审批实例列表
curl -s "https://oapi.dingtalk.com/topapi/processinstance/listids?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "process_code": "PROC-xxxxxxxx-xxxx-xxxx",
    "start_time": 1704067200000,
    "end_time": 1706745600000,
    "size": 20,
    "cursor": 0
  }' | jq '.'

# 获取审批详情
curl -s "https://oapi.dingtalk.com/topapi/processinstance/get?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "process_instance_id": "xxxxxxxxxxxxxxxx"
  }' | jq '.'

# 获取审批模板列表
curl -s "https://oapi.dingtalk.com/topapi/processtemplate/list?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
```

#### 2.3.5 日程管理

```bash
# 创建日程
curl -s "https://oapi.dingtalk.com/topapi/calendar/create?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "create_vo": {
      "summary": "项目周会",
      "start_time": {"timestamp": 1717207200000, "timezone": "Asia/Shanghai"},
      "end_time": {"timestamp": 1717210800000, "timezone": "Asia/Shanghai"},
      "attendees": [{"userid": "user001"}, {"userid": "user002"}],
      "description": "本周项目进度同步"
    }
  }' | jq '.'

# 查询日程列表
curl -s "https://oapi.dingtalk.com/topapi/calendar/list?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query_start_time": 1717207200000,
    "query_end_time": 1719799200000
  }' | jq '.'
```

#### 2.3.6 群管理

```bash
# 获取群成员列表
curl -s "https://oapi.dingtalk.com/chat/get?access_token=${ACCESS_TOKEN}&chatid=chatxxxxxxxxxxxxxxxx" | jq '.'

# 获取企业内部群列表
curl -s "https://oapi.dingtalk.com/chat/list?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"offset": 0, "size": 50}' | jq '.'
```

### 2.4 封装成可复用脚本（进阶）

为便于 Agent 长期使用，可将常用操作封装为 shell 函数：

```bash
# ~/.bashrc 或 ~/.zshrc 中添加以下函数

# 钉钉 API 基础函数
dingtalk_token() {
  curl -s "https://oapi.dingtalk.com/gettoken?appkey=${DINGTALK_APP_KEY}&appsecret=${DINGTALK_APP_SECRET}" | jq -r '.access_token'
}

dingtalk_send_text() {
  local chatid="$1"
  local content="$2"
  local token=$(dingtalk_token)
  curl -s "https://oapi.dingtalk.com/robot/send?access_token=${token}" \
    -H "Content-Type: application/json" \
    -d "{\"chatid\":\"${chatid}\",\"msg\":{\"msgtype\":\"text\",\"text\":{\"content\":\"${content}\"}}}"
}

dingtalk_dept_list() {
  local token=$(dingtalk_token)
  curl -s "https://oapi.dingtalk.com/department/list?access_token=${token}" | jq '.department'
}

dingtalk_user_list() {
  local dept_id="${1:-1}"
  local token=$(dingtalk_token)
  curl -s "https://oapi.dingtalk.com/user/listbypage?access_token=${token}&department_id=${dept_id}&offset=0&size=100" | jq '.userlist'
}

dingtalk_process_list() {
  local process_code="$1"
  local start_time="${2:-$(date -v-7d +%s)000}"
  local end_time="${3:-$(date +%s)000}"
  local token=$(dingtalk_token)
  curl -s "https://oapi.dingtalk.com/topapi/processinstance/listids?access_token=${token}" \
    -H "Content-Type: application/json" \
    -d "{\"process_code\":\"${process_code}\",\"start_time\":${start_time},\"end_time\":${end_time},\"size\":20,\"cursor\":0}"
}
```

### 2.5 Agent 执行参考

当 AI Agent 需要根据本文档执行钉钉操作时，遵循以下规范：

#### 执行前检查清单

```bash
# 1. 确认环境变量已配置
echo $DINGTALK_APP_KEY
echo $DINGTALK_APP_SECRET

# 2. 确认 AccessToken 可正常获取
ACCESS_TOKEN=$(curl -s "https://oapi.dingtalk.com/gettoken?appkey=${DINGTALK_APP_KEY}&appsecret=${DINGTALK_APP_SECRET}" | jq -r '.access_token')
echo $ACCESS_TOKEN

# 3. 确认目标 chatid / userid 正确（通过 dept_list / user_list 查询）
```

#### 常用命令速查表

| 任务 | 命令模板 |
|------|---------|
| 获取 Token | `curl -s "https://oapi.dingtalk.com/gettoken?appkey=${DINGTALK_APP_KEY}&appsecret=${DINGTALK_APP_SECRET}" \| jq -r '.access_token'` |
| 发送文本消息 | `curl -s "https://oapi.dingtalk.com/robot/send?access_token=${TOKEN}" -H "Content-Type: application/json" -d '{"chatid":"...","msg":{"msgtype":"text","text":{"content":"..."}}}'` |
| 发送 Markdown 消息 | `curl -s "https://oapi.dingtalk.com/robot/send?access_token=${TOKEN}" -H "Content-Type: application/json" -d '{"chatid":"...","msg":{"msgtype":"markdown","markdown":{"title":"...","text":"..."}}}'` |
| 获取部门列表 | `curl -s "https://oapi.dingtalk.com/department/list?access_token=${TOKEN}"` |
| 获取部门成员 | `curl -s "https://oapi.dingtalk.com/user/listbypage?access_token=${TOKEN}&department_id=1&offset=0&size=100"` |
| 获取员工详情 | `curl -s "https://oapi.dingtalk.com/user/get?access_token=${TOKEN}&userid=..."` |
| 查询审批实例 | `curl -s "https://oapi.dingtalk.com/topapi/processinstance/listids?access_token=${TOKEN}" -H "Content-Type: application/json" -d '{"process_code":"...","start_time":...,"end_time":...}'` |
| 获取审批详情 | `curl -s "https://oapi.dingtalk.com/topapi/processinstance/get?access_token=${TOKEN}" -H "Content-Type: application/json" -d '{"process_instance_id":"..."}'` |
| 创建日程 | `curl -s "https://oapi.dingtalk.com/topapi/calendar/create?access_token=${TOKEN}" -H "Content-Type: application/json" -d '{"create_vo":{...}}'` |
| 查询日程 | `curl -s "https://oapi.dingtalk.com/topapi/calendar/list?access_token=${TOKEN}" -H "Content-Type: application/json" -d '{"query_start_time":...,"query_end_time":...}'` |
| 获取群成员 | `curl -s "https://oapi.dingtalk.com/chat/get?access_token=${TOKEN}&chatid=..."` |

#### 错误处理指南

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `40035 invalid request` | 参数格式错误 | 检查 JSON 格式，确保引号、逗号正确 |
| `40014 invalid access_token` | Token 过期或无效 | 重新获取 AccessToken |
| `43004 not in the white list` | IP 不在白名单 | 在钉钉开放平台「服务器出口 IP」中添加当前 IP |
| `60020 not allowed to access this API` | 应用未开通对应权限 | 去钉钉开放平台开通权限并重新发布应用 |
| `40001 invalid credential` | AppKey/AppSecret 错误 | 检查环境变量配置 |
| `401 ` | 未授权 | 确认应用已发布，用户已授权 |

---

## 三、飞书 CLI（lark-cli）【待补充】

> **说明**：飞书 CLI 详细使用说明后续版本补充，以下为简要信息。

### 3.1 简介

飞书 CLI（`lark-cli`）是飞书官方提供的命令行工具，支持以下核心功能：

- **云文档**：创建、编辑、搜索文档
- **即时通讯**：发送消息、管理群聊
- **日历**：创建日程、查询忙闲状态
- **任务**：创建待办、管理任务清单
- **多维表格**：建表、读写记录
- **画板**：绘制架构图、流程图

### 3.2 安装

```bash
# 通过 npm 全局安装
npm install -g @larksuiteoapi/lark-cli

# 验证安装
lark-cli --version
```

### 3.3 认证

```bash
# 用户身份登录（Device Flow，需在浏览器确认授权）
lark-cli auth login --domain docs

# Bot 身份（自动，需提前配置 appId + appSecret）
# lark-cli config init
```

### 3.4 常用命令速查

| 任务 | 命令 |
|------|------|
| 创建文档 | `lark-cli docs +create --title "文档标题"` |
| 搜索文档 | `lark-cli docs +search --query "关键词"` |
| 发送消息 | `lark-cli im message create --receive-id <ID> --msg-type text --content "内容"` |
| 创建日程 | `lark-cli calendar create --summary "会议标题" --start-time <时间> --end-time <时间>` |
| 查询日程 | `lark-cli calendar +agenda` |

> 详细说明请等待文档 v2.0 版本更新。

---

## 四、通用常见问题

| 问题 | 解决方案 |
|------|---------|
| `curl: command not found` | macOS/Linux 自带，Windows 安装 Git Bash 或 WSL |
| `jq: command not found` | `brew install jq` (macOS) 或 `apt-get install jq` (Linux) |
| `invalid access_token` | 重新获取 Token，检查有效期 |
| `not in the white list` | 在开放平台后台添加服务器出口 IP |
| `permission denied` / `not allowed` | 为应用开通对应 API 权限并重新发布 |
| 群消息发送失败 | 确认机器人已加入群聊，且 chatid 正确 |
| Token 过期 | 钉钉 Token 有效期 2 小时，需重新获取 |

---

## 五、快速对比总结

| 对比项 | 钉钉 | 飞书 |
|--------|------|------|
| 核心方式 | **REST API + curl** | `lark-cli` 命令行工具 |
| 安装 | 无需安装 CLI，curl 即可 | `npm install -g @larksuiteoapi/lark-cli` |
| 认证 | AppKey + AppSecret | Bot / User OAuth |
| 发送消息 | `curl https://oapi.dingtalk.com/robot/send` | `lark-cli im message create` |
| 查通讯录 | `curl https://oapi.dingtalk.com/department/list` | `lark-cli contact user search` |
| 日程管理 | `curl https://oapi.dingtalk.com/topapi/calendar/*` | `lark-cli calendar create` |
| 文档操作 | 不支持 | `lark-cli docs +create / +update` |

---

> **文档版本**：v1.1  
> **更新时间**：2024-05-27  
> **钉钉 Open API**：详细覆盖（curl 方式，Agent 可直接执行）  
> **飞书 CLI**：简要信息，待后续版本补充详细说明
