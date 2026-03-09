# 快速操作指南 - 对象存储问题

## 当前状态

✅ 登录功能：正常
❌ 图片上传：失败（AccessDenied: missing token）

## 快速诊断（5分钟）

### 步骤 1: 确认部署已完成

访问 Vercel Dashboard，确认最新提交 `cfc22f4` 已部署成功。

### 步骤 2: 登录系统

1. 访问 `https://hanhai.cloud/login`
2. 使用邮箱和密码登录
3. 确认登录成功

### 步骤 3: 获取 Token

1. 在浏览器中按 `F12` 打开开发者工具
2. 切换到 `Application` 标签
3. 在左侧找到 `Local Storage`
4. 点击 `https://hanhai.cloud`
5. 复制 `auth_token` 的值

### 步骤 4: 运行简化测试

在终端中执行：

```bash
curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  https://hanhai.cloud/api/diagnostics/storage-simple
```

### 步骤 5: 查看结果

#### 如果返回成功：

```json
{
  "success": true,
  "uploadSuccess": true,
  "urlSuccess": true,
  "message": "所有测试通过"
}
```

✅ 恭喜！对象存储已正常工作，可以正常上传图片。

#### 如果返回失败：

查看返回的错误类型和建议，进行相应的修复。

## 常见错误快速修复

### 错误：AccessDenied: missing token

**可能原因**:
- 端点 URL 不正确
- Bucket 名称不正确
- 网络问题

**快速检查**:

1. 检查 Vercel 环境变量：
```
COZE_BUCKET_ENDPOINT_URL
COZE_BUCKET_NAME
```

2. 测试网络连接：
```bash
curl -I https://integration.coze.cn/coze-coding-s3proxy/v1
```

3. 运行高级诊断：
```bash
curl -H "Authorization: Bearer <your-token>" \
  https://hanhai.cloud/api/diagnostics/storage-advanced
```

### 错误：NoSuchBucket

**解决方案**:
1. 检查 `COZE_BUCKET_NAME` 环境变量
2. 确认 bucket 是否存在
3. 重新部署应用

### 错误：Network Error

**解决方案**:
1. 检查网络连接
2. 尝试使用代理
3. 联系网络管理员

## 临时解决方案

如果对象存储问题无法快速解决，可以：

### 方案 1: 使用 Base64 编码

暂时将图片转为 Base64 存储在数据库中。

### 方案 2: 禁用图片上传

暂时隐藏图片上传功能，等待问题解决。

### 方案 3: 使用其他存储服务

迁移到其他对象存储服务。

## 下一步

1. 运行简化测试
2. 根据结果选择解决方案
3. 如果问题持续，提供诊断结果

## 需要帮助？

如果以上步骤都无法解决问题，请提供：

1. 简化测试的完整返回结果
2. Vercel 环境变量配置（脱敏）
3. Vercel 实时日志
4. 浏览器开发者工具中的错误信息

---

**最后更新**: 2026-03-06
**相关提交**: cfc22f4
