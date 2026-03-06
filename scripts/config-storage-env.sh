#!/bin/bash

# 对象存储环境变量配置脚本
# 用于批量修改所有使用 S3Storage 的文件

echo "开始配置对象存储环境变量..."

# 需要修改的文件列表
files=(
  "src/app/api/product-center/feedback-images/route.ts"
  "src/app/api/product-center/feedback-images/[key]/route.ts"
  "src/app/api/upload/route.ts"
)

# 旧的配置模式
old_config="new S3Storage\({
  endpointUrl: process\.env\.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process\.env\.COZE_BUCKET_NAME,
  region: 'cn-beijing',
\})"

# 新的配置模式
new_config="new S3Storage\({
  endpointUrl: process\.env\.COZE_BUCKET_ENDPOINT_URL,
  accessKey: process\.env\.COZE_STORAGE_ACCESS_KEY || '',
  secretKey: process\.env\.COZE_STORAGE_SECRET_KEY || '',
  bucketName: process\.env\.COZE_BUCKET_NAME,
  region: 'cn-beijing',
\})"

# 遍历所有文件
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "修改文件: $file"
    sed -i 's/accessKey: '"'"''"'"',/accessKey: process.env.COZE_STORAGE_ACCESS_KEY || '"'"''"'"',/g' "$file"
    sed -i 's/secretKey: '"'"''"'"',/secretKey: process.env.COZE_STORAGE_SECRET_KEY || '"'"''"'"',/g' "$file"
    echo "✅ 已修改: $file"
  else
    echo "⚠️  文件不存在: $file"
  fi
done

echo ""
echo "配置完成！"
echo ""
echo "下一步："
echo "1. 在 Vercel 中添加环境变量："
echo "   - COZE_STORAGE_ACCESS_KEY"
echo "   - COZE_STORAGE_SECRET_KEY"
echo ""
echo "2. 提交并推送代码"
echo ""
echo "3. Vercel 会自动重新部署"
