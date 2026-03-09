#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Loading environment variables from Coze..."

python3 -c "
from coze_workload_identity import Client
client = Client()
env_vars = client.get_project_env_vars()
client.close()
for env_var in env_vars:
    if env_var.key.startswith('COZE_'):
        print(f'{env_var.key}={env_var.value}')
" > .env.local

echo "Environment variables written to .env.local"

# 显示写入的内容
echo "Content of .env.local:"
cat .env.local
