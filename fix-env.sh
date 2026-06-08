#!/bin/bash
# Fix missing env vars and restart container
set -e

cd /root/ai_multi_image

# Add required env vars if missing
if ! grep -q "^BETTER_AUTH_SECRET=" .env 2>/dev/null; then
    echo "BETTER_AUTH_SECRET=ai-image-mvp-secret-$(date +%s)-random-key" >> .env
    echo "Added BETTER_AUTH_SECRET"
fi

if ! grep -q "^BETTER_AUTH_URL=" .env 2>/dev/null; then
    echo "BETTER_AUTH_URL=https://imagept.ai" >> .env
    echo "Added BETTER_AUTH_URL"
fi

if ! grep -q "^NEXT_PUBLIC_APP_URL=" .env 2>/dev/null; then
    echo "NEXT_PUBLIC_APP_URL=https://imagept.ai" >> .env
    echo "Added NEXT_PUBLIC_APP_URL"
fi

# Restart container to pick up new env
docker restart ai-image-mvp
sleep 3

# Show logs
echo "=== Container logs ==="
docker logs --tail 20 ai-image-mvp

# Show status
echo "=== Container status ==="
docker ps | grep ai-image-mvp
