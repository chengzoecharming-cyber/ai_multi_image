# AI 制图工作台

一个基于 Next.js 的任务式 AI 电商制图工作台，支持商品图分析、AI 生成创意方案、图片生成全流程。

## 功能特性

- **任务式 AI 工作台 (V2)** — 上传商品图 + 输入制图目标，AI 自动生成多套方案
- **单图/组图双模式** — 单张主图方案 或 五张详情组图方案
- **AI 分析商品图** — 火山引擎多模态模型自动识别产品类型、结构特征、材质
- **多方案对比** — 同一商品可生成 3 种不同风格的方案，供选择对比
- **Prompt 预览** — 每个方案可查看/编辑生图 Prompt
- **图片生成** — 火山引擎 Seedream 模型生成高质量电商图片（1024×1024 起，支持 2K）
- **方案模板库** — 支持保存自定义模板，快速复用

## 技术栈

- **Next.js 16** + React 19 + TypeScript + Tailwind CSS
- **Turbopack** 快速开发
- **Prisma + SQLite** 数据持久化
- **火山引擎** — 豆包多模态 LLM（方案分析）+ Seedream（图片生成）

---

## Windows 本地部署指南

### 前置依赖

1. **Node.js**（v18 或更高）
   - 下载：https://nodejs.org/ （选 **LTS** 版本）
   - 安装时勾选 **"Add to PATH"**
   - 安装完成后，在命令行输入 `node -v` 验证

2. **Git**（可选，用于 clone 代码）
   - 下载：https://git-scm.com/download/win

### 安装步骤

```bash
# 1. 进入项目目录
cd ai-image-mvp

# 2. 安装依赖（如果网络慢，可换国内镜像）
npm install

# 3. 配置环境变量
# 复制 .env.example 为 .env（或直接编辑已有的 .env）
# 填入你的火山引擎 API Key
```

### 配置 .env

编辑 `ai-image-mvp/.env` 文件（用记事本即可，保持 UTF-8 编码）：

```env
# 图片生成 Provider
IMAGE_PROVIDER=volcano

# 火山引擎 API Key（方舟平台）
VOLCANO_API_KEY=ark-你的key

# 方案分析用的多模态 LLM（已验证可用）
LLM_MODEL=doubao-seed-2-0-lite-260215

# Seedream 生图模型
VOLCANO_MODEL=doubao-seedream-5-0-260128
```

> **如何获取 API Key？**
> 1. 登录 [火山引擎控制台](https://console.volcengine.com)
> 2. 进入「方舟大模型平台」→「API Key 管理」
> 3. 创建并复制 Key（格式为 `ark-xxxxxxxx`）

### 启动开发服务器

```bash
cd ai-image-mvp
npx next dev
```

浏览器打开：**http://localhost:3000/ai-image/v2**

### 生产环境部署（更稳更快）

```bash
cd ai-image-mvp
npm run build    # 构建生产包
npm start        # 启动生产服务器
```

---

## 常见问题

### Q: 生成方案很慢？

方案分析调用的是多模态 LLM，第一次调用可能有冷启动（30-60秒），后续调用会快很多（8-15秒）。前端 loading 页面已提示等待时间。

### Q: 可以换其他 LLM 吗？

可以。在 `.env` 中修改 `LLM_MODEL` 为你想用的模型 ID 或 Endpoint ID（如 `ep-xxxxxxxx`）。代码会自动尝试多个备用模型。

### Q: 图片文件存在哪里？

上传的商品图保存在 `public/uploads/` 目录下，SQLite 数据库文件在 `prisma/dev.db`。

### Q: 换电脑后图片还在吗？

`public/uploads/` 和 `prisma/dev.db` 需要一起复制到新电脑，否则图片和方案记录会丢失。

---

## 项目结构

```
ai-image-mvp/
├── src/
│   ├── app/
│   │   ├── ai-image/v2/          # V2 任务式工作台
│   │   │   ├── page.tsx          # 主页面
│   │   │   ├── components.tsx    # UI 组件
│   │   │   └── types.ts          # 类型定义
│   │   └── api/ai-image/
│   │       ├── v2/plan/route.ts  # AI 方案生成 API
│   │       └── generate/route.ts # 图片生成 API
│   └── lib/image-providers/      # 生图 Provider 实现
│       ├── volcano-provider.ts   # 火山引擎 Seedream
│       └── ...
├── prisma/
│   └── schema.prisma             # 数据库模型
├── public/uploads/               # 上传的商品图
└── .env                          # 环境变量配置
```
