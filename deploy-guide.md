# Docker 部署步骤

## 1. 服务器拉取最新代码

```bash
cd /path/to/your/project/ai-image-mvp
git pull origin branch/v2plus
```

## 2. 停止现有容器

```bash
docker compose down
```

## 3. 清理缓存（关键步骤）

```bash
# 清理 Docker build 缓存，确保重新构建时不会用旧的 layer
docker builder prune -f

# 清理未使用的镜像（释放空间）
docker image prune -f

# 如需彻底清理所有未使用的资源（容器、网络、卷、镜像）
docker system prune -f
```

## 4. 重新构建并启动

```bash
# 强制无缓存重新构建镜像
docker compose build --no-cache

# 启动容器（后台）
docker compose up -d
```

或者一步完成：

```bash
docker compose up -d --build --force-recreate
```

## 5. 验证

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 确认服务启动成功（端口 3002）
curl http://localhost:3002/api/health
```

---

## 一键脚本

```bash
#!/bin/bash
set -e
cd /path/to/your/project/ai-image-mvp
echo "[1/5] 拉取代码..."
git pull origin branch/v2plus
echo "[2/5] 停止容器..."
docker compose down
echo "[3/5] 清理构建缓存..."
docker builder prune -f
echo "[4/5] 重新构建..."
docker compose up -d --build --force-recreate
echo "[5/5] 验证..."
sleep 3
docker compose ps
echo "部署完成！"
```
