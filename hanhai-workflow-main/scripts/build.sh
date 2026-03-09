#!/bin/bash
set -Ee pipefail

# 使用绝对路径
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
cd "${COZE_WORKSPACE_PATH}"

echo "=== Build Script Debug Info ==="
echo "Working directory: $(pwd)"
echo "Workspace path: ${COZE_WORKSPACE_PATH}"
echo ""

# 列出当前目录的所有文件
echo "Current directory contents:"
ls -la | head -20
echo ""

# 检查环境变量是否已经设置（从部署平台或命令行传入）
echo "Checking if environment variables are already set..."
if [ -n "${COZE_SUPABASE_URL:-}" ] && [ -n "${COZE_SUPABASE_ANON_KEY:-}" ] && [ -n "${JWT_SECRET:-}" ]; then
  echo "✓ Environment variables already set (from deployment platform or command line)"
  echo "COZE_SUPABASE_URL: ${COZE_SUPABASE_URL:0:30}..."
  echo "COZE_SUPABASE_ANON_KEY: ${COZE_SUPABASE_ANON_KEY:0:30}..."
  echo "JWT_SECRET: ${JWT_SECRET:0:30}..."
  echo ""
else
  echo "Environment variables not set, trying to load from env files..."
  echo ""

  # 尝试从环境变量文件加载（优先级：.env.production > .env.local）
  ENV_FILE=""
  ENV_FILE_NAME=""

  # 1. 优先查找 .env.production（部署环境）
  if [ -f "${COZE_WORKSPACE_PATH}/.env.production" ]; then
    ENV_FILE="${COZE_WORKSPACE_PATH}/.env.production"
    ENV_FILE_NAME=".env.production"
  elif [ -f "$(pwd)/.env.production" ]; then
    ENV_FILE="$(pwd)/.env.production"
    ENV_FILE_NAME=".env.production"
  fi

  # 2. 如果没有 .env.production，查找 .env.local（开发环境）
  if [ -z "${ENV_FILE}" ]; then
    if [ -f "${COZE_WORKSPACE_PATH}/.env.local" ]; then
      ENV_FILE="${COZE_WORKSPACE_PATH}/.env.local"
      ENV_FILE_NAME=".env.local"
    elif [ -f "$(pwd)/.env.local" ]; then
      ENV_FILE="$(pwd)/.env.local"
      ENV_FILE_NAME=".env.local"
    fi
  fi

  if [ -f "${ENV_FILE}" ]; then
    echo "✓ ${ENV_FILE_NAME} file found at: ${ENV_FILE}"
    echo "File size: $(wc -c < "${ENV_FILE}") bytes"

    # 使用 source 命令加载环境变量（更可靠的方式）
    echo "Loading environment variables from ${ENV_FILE_NAME}..."

    # 创建临时文件来处理环境变量文件
    TEMP_ENV_FILE=$(mktemp)
    # 处理环境变量文件，添加 export 前缀
    sed 's/^/export /' "${ENV_FILE}" | grep '^export' > "${TEMP_ENV_FILE}"

    # 加载环境变量
    source "${TEMP_ENV_FILE}"
    rm "${TEMP_ENV_FILE}"

    echo "✓ Environment variables loaded from ${ENV_FILE_NAME}"

    # 验证是否成功加载
    if [ -n "${COZE_SUPABASE_URL:-}" ] && [ -n "${COZE_SUPABASE_ANON_KEY:-}" ] && [ -n "${JWT_SECRET:-}" ]; then
      echo "✓ All required environment variables loaded successfully"
      echo ""
    else
      echo "✗ Error: Failed to load all required environment variables from ${ENV_FILE_NAME}"
      echo "Checking ${ENV_FILE_NAME} content:"
      echo ""
      echo "Supabase URL line:"
      grep 'COZE_SUPABASE_URL' "${ENV_FILE}" || echo "Not found"
      echo ""
      echo "Supabase Anon Key line:"
      grep 'COZE_SUPABASE_ANON_KEY' "${ENV_FILE}" || echo "Not found"
      echo ""
      echo "JWT Secret line:"
      grep 'JWT_SECRET' "${ENV_FILE}" || echo "Not found"
      echo ""
      echo "Current environment variables:"
      env | grep -E '^(COZE_SUPABASE|JWT_SECRET)' || echo "None found"
      exit 1
    fi
  else
    echo "✗ Error: Required environment variables are not set"
    echo "✗ Error: Environment file not found (tried .env.production and .env.local)"
    echo ""
    echo "Searched paths:"
    echo "  - ${COZE_WORKSPACE_PATH}/.env.production"
    echo "  - $(pwd)/.env.production"
    echo "  - ${COZE_WORKSPACE_PATH}/.env.local"
    echo "  - $(pwd)/.env.local"
    echo ""
    echo "Please set the following environment variables:"
    echo "  - COZE_SUPABASE_URL"
    echo "  - COZE_SUPABASE_ANON_KEY"
    echo "  - JWT_SECRET"
    echo ""
    echo "You can:"
    echo "  1. Create a .env.production file for deployment (see .env.example for template)"
    echo "  2. Set environment variables in your deployment platform"
    echo "  3. Pass them as environment variables to the build command"
    exit 1
  fi
fi

# 验证必需的环境变量
echo "Verifying required environment variables..."
if [ -z "${COZE_SUPABASE_URL:-}" ]; then
  echo "✗ Error: COZE_SUPABASE_URL is not set"
  exit 1
else
  echo "✓ COZE_SUPABASE_URL is set"
fi

if [ -z "${COZE_SUPABASE_ANON_KEY:-}" ]; then
  echo "✗ Error: COZE_SUPABASE_ANON_KEY is not set"
  exit 1
else
  echo "✓ COZE_SUPABASE_ANON_KEY is set"
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "✗ Error: JWT_SECRET is not set"
  exit 1
else
  echo "✓ JWT_SECRET is set"
fi

echo ""
echo "=== Starting Build ==="
echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the project..."
npx next build

echo "Build completed successfully!"
