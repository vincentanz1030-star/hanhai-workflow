# 图片上传调试指南

## 问题现象

图片上传时出现以下错误：

```
详细信息: missing token
错误信息: 上传失败，请重试
响应状态: 500
```

## 已完成的修复

### 1. 增强的调试日志

已在以下文件中添加详细的调试日志：

#### `src/lib/token-helper.ts`

添加了以下日志：
- `[token-helper] 开始获取 token...`
- `[token-helper] Authorization header: ...`
- `[token-helper] 从 Authorization header 获取到 token，长度: ...`
- `[token-helper] 尝试从 Cookie 获取 token...`
- `[token-helper] Cookie 中的 token: ...`

#### `src/app/api/product-center/feedback-images/route.ts`

添加了以下日志：
- `[反馈图片上传] Cookie Header: ...`
- `[反馈图片上传] Authorization Header: ...`
- `[反馈图片上传] 所有 Headers: ...`
- `[反馈图片上传] 未找到认证 token`
- `[反馈图片上传] Token 验证失败`

并返回详细的 debug 信息：

```json
{
  "error": "未登录，请先登录",
  "debug": {
    "hasCookie": false,
    "hasAuthHeader": true,
    "authHeaderValue": "Bearer ...",
    "cookies": "..."
  }
}
```

### 2. 管理员账号设置

已成功设置 `hhwenhua@outlook.com` 为管理员账号。

### 3. 调试工具

创建了 `/debug-auth` 页面，提供全面的认证诊断功能。

## 如何使用调试信息

### 访问调试页面

```
https://您的域名/debug-auth
```

调试页面会自动执行以下检查：

1. ✅ 检查 localStorage 中的 token
2. ✅ 检查 Cookie 中的 token
3. ✅ 测试认证 API
4. ✅ 测试实际的图片上传

### 查看日志

所有检查结果会显示在日志框中。

## 问题诊断流程

### 步骤 1：确认代码已更新

在 Vercel Dashboard 中检查：
1. 最新提交是否已部署
2. 部署状态是否为 "Ready"

### 步骤 2：清除浏览器缓存

```
Ctrl + Shift + R
```

### 步骤 3：重新登录

1. 访问 `/login`
2. 退出登录
3. 重新登录
4. 确保显示角色 `(admin)`

### 步骤 4：访问调试页面

```
https://您的域名/debug-auth
```

查看自动检查的结果。

### 步骤 5：检查后端日志

在 Vercel Dashboard 中查看实时日志：

1. 进入项目
2. 点击 "Logs"
3. 查找 `[token-helper]` 和 `[反馈图片上传]` 的日志

## 常见问题

### 问题 1：Token 存在但后端无法读取

**日志显示**：
```json
{
  "debug": {
    "hasCookie": false,
    "hasAuthHeader": false
  }
}
```

**可能原因**：
1. Vercel 代码未更新
2. 浏览器缓存问题
3. 网络代理过滤了 Authorization header

**解决方案**：
1. 确认 Vercel 部署已完成
2. 清除浏览器缓存
3. 重新登录
4. 检查是否有网络代理

### 问题 2：代码未更新

**症状**：
- 没有看到 `[token-helper]` 的调试日志
- 错误响应中没有 `debug` 信息

**解决方案**：
1. 确认代码已推送（已推送 ✅）
2. 在 Vercel 中触发部署
3. 等待部署完成
4. 清除浏览器缓存
5. 重新测试

### 问题 3：Cookie 中的 token 丢失

**日志显示**：
```
❌ Cookie 中没有 auth_token
```

**解决方案**：
1. 清除浏览器缓存
2. 重新登录
3. 检查浏览器是否允许 Cookie
4. 检查是否有隐私插件阻止 Cookie

## 认证机制说明

系统支持双重认证：

### 1. Cookie 认证

- 由后端自动设置
- httpOnly: true
- secure: production 模式
- sameSite: lax
- 有效期：7 天

### 2. Authorization Header 认证

- 由前端手动添加
- 格式：`Bearer <token>`
- 适用于 API 调用

### 优先级

后端优先从 Authorization header 读取 token，如果没有则尝试从 Cookie 读取。

## 前端代码示例

### 正确的 API 调用方式

```typescript
// 获取 token
const token = localStorage.getItem('auth_token');

// 发送请求
const response = await fetch('/api/xxx', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  credentials: 'include',  // 包含 Cookie
  body: formData,
});
```

### 常见错误

```typescript
// ❌ 错误：没有发送 Authorization header
const response = await fetch('/api/xxx', {
  method: 'POST',
  body: formData,
});

// ❌ 错误：credentials 设置错误
const response = await fetch('/api/xxx', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  credentials: 'same-origin',  // 应该是 'include'
  body: formData,
});
```

## 设置管理员账号

### 使用脚本

```bash
node scripts/set-admin.js hhwenhua@outlook.com
```

### 使用 API

```bash
curl -X POST https://您的域名/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"email": "hhwenhua@outlook.com"}'
```

### 手动设置

在 Supabase Dashboard 中执行：

```sql
-- 查找用户 ID
SELECT id FROM users WHERE email = 'hhwenhua@outlook.com';

-- 设置为管理员
INSERT INTO user_roles (user_id, role, is_primary)
VALUES ('<user-id>', 'admin', true)
ON CONFLICT (user_id, role) DO UPDATE SET is_primary = true;
```

## 验证修复

### 1. 验证管理员权限

登录后，在页面顶部应显示：
```
hhwenhua@outlook.com (admin)
```

应能看到以下入口：
- ⚙️ 系统管理
- 🛡️ 用户管理

### 2. 验证图片上传

1. 访问 `/debug-auth` 页面
2. 点击"测试图片上传"按钮
3. 查看测试结果

如果成功，应看到：
```
✅ 图片上传成功！
```

### 3. 验证商品反馈上传

1. 登录系统
2. 进入商品中心
3. 创建或编辑反馈
4. 上传图片
5. 查看图片预览

## 下一步

如果问题仍然存在，请提供以下信息：

1. 调试页面的完整日志
2. Vercel 实时日志中的 `[token-helper]` 和 `[反馈图片上传]` 日志
3. 浏览器开发者工具 Network 标签中的请求和响应
4. 使用的浏览器和版本

## 联系支持

如果以上步骤都无法解决问题，请：

1. 收集所有日志信息
2. 截图调试页面和错误信息
3. 提交 issue 到 GitHub

---

**最后更新**: 2026-03-06
**相关提交**: e58f921, 8f7746d, 7367a77
