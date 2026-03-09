# 对象存储问题诊断与修复

## 问题描述

**错误**: `AccessDenied: missing token`

**症状**:
- 图片上传失败
- 返回 500 错误
- 错误信息: `AccessDenied: missing token`

**错误堆栈**:
```
[反馈图片上传] 错误堆栈: AccessDenied: missing token at yZ.getErrorSchemaOrThrowBaseException
```

## 已添加的诊断工具

### 1. 简化存储测试接口

**接口**: `POST /api/diagnostics/storage-simple`

**功能**: 测试最基本的上传功能

**使用方法**:

```bash
# 1. 登录系统
# 2. 在浏览器开发者工具中复制 token
# 3. 访问以下接口

curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  https://hanhai.cloud/api/diagnostics/storage-simple
```

**预期结果**:

如果成功，返回：
```json
{
  "success": true,
  "uploadSuccess": true,
  "urlSuccess": true,
  "fileKey": "...",
  "signedUrl": "...",
  "fileName": "test/simple-test-xxxxx.txt",
  "message": "所有测试通过"
}
```

如果失败，返回：
```json
{
  "success": false,
  "error": "AccessDenied: missing token",
  "errorType": "ACCESS_DENIED",
  "suggestion": "对象存储拒绝访问。可能原因：1) 端点 URL 不正确 2) bucket 名称不正确 3) 网络问题 4) SDK 版本问题",
  "config": {
    "endpointUrl": "https://integration.coze.cn/coze-coding-s3proxy/v1",
    "bucketName": "bucket_xxxxx"
  }
}
```

### 2. 高级存储诊断接口

**接口**: `GET /api/diagnostics/storage-advanced`

**功能**: 执行全面的存储诊断

**使用方法**:

```bash
curl -H "Authorization: Bearer <your-token>" \
  https://hanhai.cloud/api/diagnostics/storage-advanced
```

**诊断内容**:
1. 端点 URL 格式检查
2. 端点可访问性测试
3. 不同的初始化配置测试
4. 环境变量检查
5. 不同的文件路径测试

### 3. 基础存储检查接口

**接口**: `GET /api/diagnostics/storage-check`

**功能**: 检查存储配置并测试基本功能

## 诊断步骤

### 步骤 1: 登录系统

1. 访问 `https://hanhai.cloud/login`
2. 使用邮箱和密码登录
3. 确认登录成功

### 步骤 2: 获取 Token

1. 在浏览器中按 F12 打开开发者工具
2. 切换到 Application 标签
3. 在左侧找到 Local Storage
4. 复制 `auth_token` 的值

### 步骤 3: 运行简化测试

```bash
curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  https://hanhai.cloud/api/diagnostics/storage-simple
```

### 步骤 4: 如果简化测试失败，运行高级测试

```bash
curl -H "Authorization: Bearer <your-token>" \
  https://hanhai.cloud/api/diagnostics/storage-advanced
```

### 步骤 5: 查看结果

根据返回的错误信息，进行相应的修复。

## 常见错误与解决方案

### 错误 1: AccessDenied: missing token

**错误类型**: `ACCESS_DENIED`

**可能原因**:
1. 端点 URL 不正确
2. Bucket 名称不正确
3. 网络问题
4. SDK 版本问题
5. 对象存储服务配置问题

**解决方案**:

#### 方案 1: 检查 Vercel 环境变量

确保以下环境变量已正确配置：
```
COZE_BUCKET_ENDPOINT_URL=https://integration.coze.cn/coze-coding-s3proxy/v1
COZE_BUCKET_NAME=bucket_xxxxx
```

#### 方案 2: 检查对象存储服务

1. 访问对象存储管理控制台
2. 确认 bucket 是否存在
3. 确认 bucket 权限配置
4. 确认 bucket 所在区域

#### 方案 3: 测试网络连接

```bash
curl -I https://integration.coze.cn/coze-coding-s3proxy/v1
```

#### 方案 4: 检查 SDK 版本

```bash
cd /workspace/projects
pnpm list coze-coding-dev-sdk
```

如果版本过旧，尝试更新：
```bash
pnpm update coze-coding-dev-sdk
```

### 错误 2: NoSuchBucket

**错误类型**: `NO_SUCH_BUCKET`

**解决方案**:
1. 检查 `COZE_BUCKET_NAME` 环境变量
2. 确认 bucket 是否存在
3. 确认 bucket 名称拼写正确

### 错误 3: Network Error / ETIMEDOUT

**错误类型**: `NETWORK_ERROR`

**解决方案**:
1. 检查网络连接
2. 检查防火墙设置
3. 检查 DNS 解析
4. 尝试使用代理

### 错误 4: 未设置环境变量

**解决方案**:
1. 在 Vercel Dashboard 中添加环境变量
2. 确保环境变量名称正确
3. 重新部署应用

## 临时解决方案

如果对象存储问题无法快速解决，可以考虑以下临时方案：

### 方案 1: 使用 Base64 编码

对于小图片，可以使用 Base64 编码存储在数据库中：

```typescript
// 前端：将图片转为 Base64
const reader = new FileReader();
reader.onload = (e) => {
  const base64 = e.target.result;
  // 上传 base64 字符串
};
reader.readAsDataURL(file);

// 后端：直接存储 base64 字符串
```

**优点**: 简单快速，无需额外配置
**缺点**: 不适合大图片，数据库体积增大

### 方案 2: 暂时禁用图片上传

修改代码，暂时禁用图片上传功能：

```typescript
// 在组件中隐藏图片上传按钮
{false && <ImageUpload />}
```

**优点**: 立即解决问题
**缺点**: 用户体验受影响

### 方案 3: 使用第三方存储服务

使用其他对象存储服务，如：
- AWS S3
- 阿里云 OSS
- 腾讯云 COS
- 七牛云

**优点**: 稳定可靠
**缺点**: 需要额外配置和费用

## 下一步操作

### 1. 在 Vercel 中触发部署

1. 访问 Vercel Dashboard
2. 进入项目
3. 点击 "Deployments"
4. 确认最新提交 `81e98b9` 已部署成功

### 2. 运行诊断

```bash
# 获取 token（在浏览器开发者工具中）
# 运行简化测试
curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  https://hanhai.cloud/api/diagnostics/storage-simple
```

### 3. 查看诊断结果

根据返回的错误类型，选择相应的解决方案。

### 4. 如果问题持续存在

提供以下信息以便进一步诊断：

1. 简化测试的完整返回结果
2. 高级测试的完整返回结果
3. Vercel 实时日志
4. 浏览器开发者工具中的错误信息
5. Vercel 环境变量配置（脱敏）

## 技术支持

如果以上步骤都无法解决问题，请：

1. 收集所有诊断信息
2. 截图诊断结果
3. 提交 issue 到 GitHub

---

**最后更新**: 2026-03-06
**相关提交**: 81e98b9, 2bc15ed, dfd2d6f
