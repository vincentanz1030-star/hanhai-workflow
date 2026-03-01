#!/bin/bash
set -Ee pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# 加载 .env.local 文件中的环境变量
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local..."
  export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "Verifying required environment variables..."
if [ -z "${COZE_SUPABASE_URL:-}" ]; then
  echo "Error: COZE_SUPABASE_URL is not set"
  exit 1
fi

if [ -z "${COZE_SUPABASE_ANON_KEY:-}" ]; then
  echo "Error: COZE_SUPABASE_ANON_KEY is not set"
  exit 1
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "Error: JWT_SECRET is not set"
  exit 1
fi

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the project..."
npx next build

echo "Build completed successfully!"
