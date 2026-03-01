#!/bin/bash
set -Ee pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

start_service() {
    cd "${COZE_WORKSPACE_PATH}"

    # 加载 .env.local 文件中的环境变量
    if [ -f .env.local ]; then
      echo "Loading environment variables from .env.local..."
      export $(cat .env.local | grep -v '^#' | xargs)
    fi

    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    npx next start --port ${DEPLOY_RUN_PORT}
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
