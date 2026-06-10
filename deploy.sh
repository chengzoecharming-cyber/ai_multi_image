#!/bin/bash
# 一键部署脚本：拉取最新 ghcr.io 镜像并重启 ai-image-mvp 容器
# 使用方法：
#   1. 在 GitHub 推送代码，等待 Actions 构建成功（绿色 ✅）
#   2. 在服务器执行：bash /root/ai_multi_image/deploy.sh

set -e

echo "🚀 开始部署 ai-image-mvp..."

# 1. 拉取最新镜像
echo "⬇️  拉取最新镜像..."
sudo docker pull ghcr.io/chengzoecharming-cyber/ai_multi_image:latest

# 2. 删除旧容器
echo "🗑️  删除旧容器..."
sudo docker rm -f ai-image-mvp 2>/dev/null || true

# 3. 重新创建容器
echo "🐳 创建新容器..."
sudo docker run -d \
  --name ai-image-mvp \
  --network ai-net \
  -p 3002:3002 \
  --restart always \
  --env-file /root/ai_multi_image/.env \
  -v /root/ai_multi_image/public/uploads:/app/public/uploads \
  -v /root/ai_multi_image/public/generated:/app/public/generated \
  -v /root/ai_multi_image/prisma:/app/prisma \
  ghcr.io/chengzoecharming-cyber/ai_multi_image:latest

# 4. 查看日志
echo "📋 容器日志（最近 10 行）："
sleep 2
sudo docker logs ai-image-mvp --tail 10

# 5. 清理旧镜像（只保留当前运行的镜像）
echo "🧹 清理旧的未使用镜像..."
sudo docker image prune -af > /dev/null 2>&1 || true

echo ""
echo "✅ 部署完成！访问 https://imagept.ai 验证"
