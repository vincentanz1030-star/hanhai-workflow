#!/bin/bash
set -e

echo "=== Vercel Build Script ==="

# Vercel 会自动注入环境变量，无需额外检查
echo "Environment variables from Vercel:"
echo "COZE_SUPABASE_URL: ${COZE_SUPABASE_URL:0:30}..."
echo "COZE_SUPABASE_ANON_KEY: ${COZE_SUPABASE_ANON_KEY:0:30}..."
echo "JWT_SECRET: ${JWT_SECRET:0:30}..."
echo ""

# 验证必需的环境变量
if [ -z "${COZE_SUPABASE_URL:-}" ] || [ -z "${COZE_SUPABASE_ANON_KEY:-}" ] || [ -z "${JWT_SECRET:-}" ]; then
  echo "Error: Missing required environment variables"
  echo "Please ensure the following are set in Vercel:"
  echo "  - COZE_SUPABASE_URL"
  echo "  - COZE_SUPABASE_ANON_KEY"
  echo "  - JWT_SECRET"
  exit 1
fi

echo "=== Installing dependencies ==="
pnpm install --prefer-frozen-lockfile

echo "=== Building Next.js ==="
npx next build

echo "=== Build completed successfully ==="
