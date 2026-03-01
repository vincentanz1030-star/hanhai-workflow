#!/bin/bash
set -Ee pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

start_service() {
    cd "${COZE_WORKSPACE_PATH}"

    # 检查环境变量是否已经设置
    if [ -z "${COZE_SUPABASE_URL:-}" ] || [ -z "${COZE_SUPABASE_ANON_KEY:-}" ] || [ -z "${JWT_SECRET:-}" ]; then
      echo "Loading environment variables from env files..."

      ENV_FILE=""

      # 优先查找 .env.production（部署环境）
      if [ -f "${COZE_WORKSPACE_PATH}/.env.production" ]; then
        ENV_FILE="${COZE_WORKSPACE_PATH}/.env.production"
      elif [ -f "$(pwd)/.env.production" ]; then
        ENV_FILE="$(pwd)/.env.production"
      fi

      # 如果没有 .env.production，查找 .env.local（开发环境）
      if [ -z "${ENV_FILE}" ]; then
        if [ -f "${COZE_WORKSPACE_PATH}/.env.local" ]; then
          ENV_FILE="${COZE_WORKSPACE_PATH}/.env.local"
        elif [ -f "$(pwd)/.env.local" ]; then
          ENV_FILE="$(pwd)/.env.local"
        fi
      fi

      if [ -f "${ENV_FILE}" ]; then
        # 使用 source 命令加载环境变量
        TEMP_ENV_FILE=$(mktemp)
        sed 's/^/export /' "${ENV_FILE}" | grep '^export' > "${TEMP_ENV_FILE}"
        source "${TEMP_ENV_FILE}"
        rm "${TEMP_ENV_FILE}"
        echo "✓ Environment variables loaded from ${ENV_FILE}"
      else
        echo "⚠ Warning: Environment file not found, using existing environment variables"
      fi
    fi

    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    npx next start --port ${DEPLOY_RUN_PORT}
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
