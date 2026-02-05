#!/bin/bash
# 启动脚本：先生成 Prisma 客户端，再启动应用
set -e

echo "=== 正在生成 Prisma 客户端 ==="
cd /app/my-app 2>/dev/null || cd /app
npx prisma generate

echo "=== 启动应用 ==="
npm run start
