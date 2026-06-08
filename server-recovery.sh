#!/bin/bash
# Server Recovery Script for ai-image-mvp
# Run this on the server with: sudo bash server-recovery.sh

set -e

echo "=== Step 1: Kill CPU-hogging crond process ==="
CROND_PID=$(pgrep -f '^./crond' || true)
if [ -n "$CROND_PID" ]; then
    echo "Killing crond PID: $CROND_PID"
    kill -9 $CROND_PID 2>/dev/null || true
else
    echo "No crond process found"
fi

echo ""
echo "=== Step 2: Stop and remove old ai-image-mvp container ==="
docker rm -f ai-image-mvp 2>/dev/null || true

echo ""
echo "=== Step 3: Ensure .env has required variables ==="
ENV_FILE="/root/ai_multi_image/.env"

# Create .env if not exists
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
fi

# Add BETTER_AUTH_SECRET if missing
if ! grep -q "^BETTER_AUTH_SECRET=" "$ENV_FILE"; then
    echo "BETTER_AUTH_SECRET=ai-image-mvp-secret-$(date +%s)-$(openssl rand -hex 8)" >> "$ENV_FILE"
    echo "Added BETTER_AUTH_SECRET"
fi

# Add BETTER_AUTH_URL if missing
if ! grep -q "^BETTER_AUTH_URL=" "$ENV_FILE"; then
    echo "BETTER_AUTH_URL=https://imagept.ai" >> "$ENV_FILE"
    echo "Added BETTER_AUTH_URL"
fi

# Add NEXT_PUBLIC_APP_URL if missing
if ! grep -q "^NEXT_PUBLIC_APP_URL=" "$ENV_FILE"; then
    echo "NEXT_PUBLIC_APP_URL=https://imagept.ai" >> "$ENV_FILE"
    echo "Added NEXT_PUBLIC_APP_URL"
fi

echo ""
echo "=== Step 4: Pull latest image ==="
docker pull ghcr.io/chengzoecharming-cyber/ai_multi_image:latest

echo ""
echo "=== Step 5: Start container with docker run (bypass docker-compose v1 bug) ==="
cd /root/ai_multi_image

docker run -d \
  --name ai-image-mvp \
  --restart unless-stopped \
  -p 3002:3002 \
  --env-file .env \
  -v "$(pwd)/public/uploads:/app/public/uploads" \
  -v "$(pwd)/public/generated:/app/public/generated" \
  -v "$(pwd)/prisma:/app/prisma" \
  ghcr.io/chengzoecharming-cyber/ai_multi_image:latest

echo ""
echo "=== Step 6: Verify container is running ==="
sleep 3
docker ps | grep ai-image-mvp

echo ""
echo "=== Step 7: Show recent logs ==="
docker logs --tail 30 ai-image-mvp

echo ""
echo "=== Recovery complete ==="
