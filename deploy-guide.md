# Docker 部署步骤（V2 修复版）

> **重要**：本次修复涉及 session 合并逻辑、API 增量更新、用户隔离、提示词生成规则。部署前必须按以下步骤清理脏数据，否则历史 session 可能仍然异常。

---

## 前置检查清单

```bash
# 1. 确认当前分支代码已推送
git status
git log --oneline -3

# 2. 确认 docker-compose.yml 中有以下 volumes（持久化关键）
grep -A5 "volumes:" docker-compose.yml
# 期望输出包含：
#   - ./public/uploads:/app/public/uploads
#   - ./public/generated:/app/public/generated
#   - ./prisma:/app/prisma

# 3. 确认 .env 文件在服务器项目根目录存在
ls -la .env
```

---

## 部署流程

### 步骤 1：本地推送代码

```bash
git add .
git commit -m "fix: V2 session merge, API upsert, prompt priority, remove size restrictions"
git push origin branch/v2plus
```

### 步骤 2：服务器拉取最新代码

```bash
cd /path/to/your/project/ai-image-mvp
git pull origin branch/v2plus
```

### 步骤 3：备份现有数据（可选但建议）

```bash
# 备份 SQLite 数据库
cp prisma/dev.db prisma/dev.db.$(date +%Y%m%d_%H%M%S).bak

# 备份已生成图片
 tar czf generated_backup_$(date +%Y%m%d_%H%M%S).tar.gz public/generated/
```

### 步骤 4：清理脏数据（关键！）

```bash
# 停止容器
docker compose down

# 清理 Docker build 缓存
docker builder prune -f
docker image prune -f
```

### 步骤 5：清理旧 session 数据（防止历史脏数据干扰）

```bash
# 进入项目目录
cd /path/to/your/project/ai-image-mvp

# 方式 A：直接删除 SQLite 数据库重新初始化（彻底重置，所有历史数据丢失）
rm -f prisma/dev.db

# 方式 B：仅清理有问题的 session（保留产品和生成记录）
# 如果 sqlite3 已安装：
sqlite3 prisma/dev.db "DELETE FROM AiImageV2Session; DELETE FROM AiImageV2Plan; DELETE FROM AiImageV2GeneratedImage; DELETE FROM AiImageV2DetailState;"

# 方式 C：使用项目自带的清理脚本
# node scripts/cleanup-v2-default-sessions.mjs
```

> **推荐**：首次部署修复后使用方式 A（删库重来），因为旧的 session 数据在合并逻辑修复后格式可能不兼容。
> 如果必须保留历史任务，使用方式 B。

### 步骤 6：重建并启动

```bash
# 强制无缓存重新构建
docker compose up -d --build --force-recreate

# 等待初始化完成（Prisma 首次运行会自动 migrate）
sleep 5
docker compose logs --tail 20
```

### 步骤 7：验证部署

```bash
# 查看容器状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 测试 API 是否通
curl -s http://localhost:3002/api/ai-image/prompt-categories | head -c 200

# 检查数据库是否初始化
docker exec ai-image-mvp ls -la prisma/
```

---

## 服务器常用查询指令

### 查看最近生成的图片

```bash
# 按时间倒序列出最近生成的图片（前 20 张）
ls -lt public/generated/ | head -20

# 查看最近 1 小时内生成的图片
find public/generated/ -type f -mmin -60 -ls

# 查看最近 24 小时内生成的图片数量
find public/generated/ -type f -mtime -1 | wc -l

# 查看所有生成图片总大小
du -sh public/generated/

# 查看生成图片数量
docker exec ai-image-mvp sqlite3 prisma/dev.db "SELECT COUNT(*) FROM AiImageTask WHERE resultImageUrl IS NOT NULL;"
```

### 查看最近上传的参考图

```bash
ls -lt public/uploads/ | head -20
```

### 查看数据库中的 Session 数据

```bash
# 查看 V2 session 数量
docker exec ai-image-mvp sqlite3 prisma/dev.db "SELECT COUNT(*) FROM AiImageV2Session;"

# 查看最近的 V2 session
docker exec ai-image-mvp sqlite3 prisma/dev.db "SELECT id, title, tenantId, userId, updatedAt FROM AiImageV2Session ORDER BY updatedAt DESC LIMIT 10;"

# 查看 V2 session 关联的生成图片
docker exec ai-image-mvp sqlite3 prisma/dev.db "SELECT g.id, g.planId, g.imageUrl, s.title FROM AiImageV2GeneratedImage g JOIN AiImageV2Plan p ON g.planId = p.id JOIN AiImageV2Session s ON p.sessionId = s.id ORDER BY g.createdAt DESC LIMIT 20;"
```

### 查看数据库中的 AI 生成任务

```bash
# 查看最近 20 个生成任务
docker exec ai-image-mvp sqlite3 prisma/dev.db "SELECT id, status, resultImageUrl, createdAt FROM AiImageTask ORDER BY createdAt DESC LIMIT 20;"

# 查看失败任务
docker exec ai-image-mvp sqlite3 prisma/dev.db "SELECT id, status, errorMessage, createdAt FROM AiImageTask WHERE status = 'failed' ORDER BY createdAt DESC LIMIT 20;"
```

### 查看容器日志（排查问题）

```bash
# 查看最近 100 行日志
docker compose logs --tail 100

# 查看包含错误的日志
docker compose logs | grep -i "error\|fail\|exception" | tail -20

# 查看图片生成相关日志
docker compose logs | grep -i "generate\|persist\|upload" | tail -30
```

---

## 持久化验证

部署后执行以下测试，确认数据不会在容器重启后丢失：

```bash
# 1. 生成一张测试图片（通过 UI 操作或 API 调用）

# 2. 确认图片已写入宿主机目录
ls -la public/generated/ | head -5

# 3. 重启容器
docker compose restart

# 4. 确认图片仍然存在
ls -la public/generated/ | head -5

# 5. 确认数据库数据仍在
docker exec ai-image-mvp sqlite3 prisma/dev.db "SELECT COUNT(*) FROM AiImageTask;"
```

---

## 一键部署脚本

保存为 `deploy.sh` 并在服务器执行：

```bash
#!/bin/bash
set -e

PROJECT_DIR="/path/to/your/project/ai-image-mvp"
cd "$PROJECT_DIR"

echo "[1/6] 拉取代码..."
git pull origin branch/v2plus

echo "[2/6] 备份数据..."
cp prisma/dev.db prisma/dev.db.$(date +%Y%m%d_%H%M%S).bak 2>/dev/null || true

echo "[3/6] 停止容器..."
docker compose down

echo "[4/6] 清理构建缓存..."
docker builder prune -f
docker image prune -f

echo "[5/6] 清理旧 session 数据..."
rm -f prisma/dev.db

echo "[6/6] 重建并启动..."
docker compose up -d --build --force-recreate

sleep 5
echo ""
echo "=== 部署完成 ==="
docker compose ps
echo ""
echo "生成图片数量: $(find public/generated/ -type f | wc -l)"
echo "上传图片数量: $(find public/uploads/ -type f | wc -l)"
echo ""
echo "查看日志: docker compose logs -f"
```

---

## 回滚方案

如果部署后出现问题，快速回滚：

```bash
cd /path/to/your/project/ai-image-mvp

# 1. 停止容器
docker compose down

# 2. 恢复数据库备份
cp prisma/dev.db.XXXXXX.bak prisma/dev.db

# 3. 回退代码
git reset --hard HEAD~1
git pull origin branch/v2plus   # 或者指定上一个已知稳定的 commit

# 4. 重新构建启动
docker compose up -d --build --force-recreate
```
