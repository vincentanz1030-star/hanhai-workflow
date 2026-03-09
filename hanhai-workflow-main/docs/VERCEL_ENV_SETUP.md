# Vercel 环境变量配置指南

## 问题分析

当前对象存储返回 `AccessDenied: missing token` 错误，说明需要提供认证信息。

## 解决方案

### 方案 1: 使用 COZE_LOOP_API_TOKEN

从环境变量中可以看到有 `COZE_LOOP_API_TOKEN`，这个 token 可能用于对象存储认证。

#### 步骤 1: 获取 COZE_LOOP_API_TOKEN

在本地环境中运行：
```bash
echo $COZE_LOOP_API_TOKEN
```

或查看 .env.local 文件中的值。

#### 步骤 2: 在 Vercel 中添加环境变量

1. 访问 Vercel Dashboard
2. 进入项目
3. 点击 `Settings` → `Environment Variables`
4. 添加以下环境变量：

```
名称: COZE_STORAGE_ACCESS_KEY
值: <COZE_LOOP_API_TOKEN 的值>

名称: COZE_STORAGE_SECRET_KEY
值: <COZE_LOOP_API_TOKEN 的值>
```

#### 步骤 3: 修改代码使用新的环境变量

修改以下文件：
- `src/app/api/product-center/feedback-images/route.ts`
- `src/app/api/upload/route.ts`

将：
```typescript
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});
```

改为：
```typescript
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: process.env.COZE_STORAGE_ACCESS_KEY || '',
  secretKey: process.env.COZE_STORAGE_SECRET_KEY || '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});
```

### 方案 2: 使用 COZE_WORKLOAD_IDENTITY

如果项目使用了 Workload Identity，可以使用这个方式获取临时凭证。

#### 步骤 1: 在 Vercel 中添加环境变量

```
名称: COZE_WORKLOAD_IDENTITY_CLIENT_ID
值: <从本地环境获取>

名称: COZE_WORKLOAD_IDENTITY_CLIENT_SECRET
值: <从本地环境获取>
```

#### 步骤 2: 修改代码使用 Workload Identity

需要创建一个辅助函数来获取临时凭证，然后使用这些凭证初始化 S3Storage。

### 方案 3: 联系 Coze 技术支持

如果上述方案都不行，需要联系 Coze 技术支持获取正确的对象存储认证方式。

## 推荐方案

**优先尝试方案 1**，因为：
- 简单直接
- 不需要额外的 API 调用
- COZE_LOOP_API_TOKEN 已经存在于环境变量中

## 快速操作指南

### 1. 获取 COZE_LOOP_API_TOKEN

```bash
# 在本地环境中运行
echo $COZE_LOOP_API_TOKEN
```

### 2. 在 Vercel 中添加环境变量

```
COZE_STORAGE_ACCESS_KEY = <从步骤 1 获取的值>
COZE_STORAGE_SECRET_KEY = <从步骤 1 获取的值>
```

### 3. 修改代码

我会帮您修改所有使用对象存储的文件。

### 4. 重新部署

添加环境变量后，Vercel 会自动触发重新部署。

## 需要的信息

请提供以下信息：

1. **COZE_LOOP_API_TOKEN 的值**（部分即可，不需要完整）
2. **您想使用哪种方案**（方案 1、方案 2 或 方案 3）

我会根据您的选择帮您完成配置和代码修改。
