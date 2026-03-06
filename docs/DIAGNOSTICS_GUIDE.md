# 诊断工具使用指南

## 当前问题

1. **对象存储上传失败**: `AccessDenied: missing token`
2. **登录失败**: 无法登录系统
3. **管理员接口返回 403**: `/api/admin/users` 返回 403

## 诊断接口

### 1. 检查对象存储配置

**接口**: `GET /api/diagnostics/storage-check`

**功能**: 检查对象存储配置是否正确，并测试上传功能

**使用方法**:

```bash
# 1. 登录系统获取 token
# 2. 在浏览器开发者工具中复制 token
# 3. 访问以下接口

curl -H "Authorization: Bearer <your-token>" \
  https://hanhai.cloud/api/diagnostics/storage-check
```

**预期结果**:

如果配置正确，应该返回：
```json
{
  "success": true,
  "uploadTest": {
    "success": true,
    "fileKey": "...",
    "signedUrl": "...",
    "deleted": true
  }
}
```

如果配置错误，可能返回：
```json
{
  "uploadTest": {
    "success": false,
    "error": "AccessDenied: missing token",
    "errorType": "ACCESS_DENIED",
    "suggestion": "对象存储需要认证，请检查环境变量配置"
  }
}
```

### 2. 检查用户信息

**接口**: `GET /api/diagnostics/user-check?email=<email>`

**功能**: 检查用户是否存在、是否激活、角色等信息

**使用方法**:

```bash
curl "https://hanhai.cloud/api/diagnostics/user-check?email=hhwenhua@outlook.com"
```

**预期结果**:

```json
{
  "success": true,
  "user": {
    "id": "deb1f7ac-ddbe-48b1-b22f-32389eedce6b",
    "email": "hhwenhua@outlook.com",
    "name": "贾伟",
    "brand": "all",
    "is_active": true,
    "status": "active",
    "created_at": "2026-02-28T15:26:56.506689+08:00"
  },
  "roles": [
    {
      "user_id": "deb1f7ac-ddbe-48b1-b22f-32389eedce6b",
      "role": "admin",
      "is_primary": true,
      "created_at": "2026-03-06T16:31:33.831565+08:00"
    }
  ],
  "rolesCount": 1
}
```

### 3. 检查密码验证

**接口**: `POST /api/diagnostics/password-check`

**功能**: 检查密码是否正确

**使用方法**:

```bash
curl -X POST https://hanhai.cloud/api/diagnostics/password-check \
  -H "Content-Type: application/json" \
  -d '{"email":"hhwenhua@outlook.com","password":"<your-password>"}'
```

**预期结果**:

```json
{
  "success": true,
  "user": {
    "id": "deb1f7ac-ddbe-48b1-b22f-32389eedce6b",
    "email": "hhwenhua@outlook.com",
    "is_active": true,
    "status": "active"
  },
  "passwordCheck": {
    "hasPasswordHash": true,
    "passwordHashLength": 60,
    "isPasswordValid": true
  }
}
```

## 诊断步骤

### 步骤 1: 检查用户信息

```bash
curl "https://hanhai.cloud/api/diagnostics/user-check?email=hhwenhua@outlook.com"
```

**检查项**:
- ✅ 用户是否存在
- ✅ `is_active` 是否为 `true`
- ✅ `status` 是否为 `active`
- ✅ `rolesCount` 是否大于 0
- ✅ 是否有 `admin` 角色

### 步骤 2: 检查密码验证

```bash
curl -X POST https://hanhai.cloud/api/diagnostics/password-check \
  -H "Content-Type: application/json" \
  -d '{"email":"hhwenhua@outlook.com","password":"<your-password>"}'
```

**检查项**:
- ✅ `hasPasswordHash` 是否为 `true`
- ✅ `passwordHashLength` 是否大于 0
- ✅ `isPasswordValid` 是否为 `true`

如果 `isPasswordValid` 为 `false`，说明密码不正确，可能需要重置密码。

### 步骤 3: 检查对象存储配置

首先登录系统，然后在浏览器开发者工具中复制 token，然后：

```bash
curl -H "Authorization: Bearer <your-token>" \
  https://hanhai.cloud/api/diagnostics/storage-check
```

**检查项**:
- ✅ `env.COZE_BUCKET_ENDPOINT_URL` 是否已设置
- ✅ `env.COZE_BUCKET_NAME` 是否已设置
- ✅ `uploadTest.success` 是否为 `true`

如果 `uploadTest.success` 为 `false` 且 `errorType` 为 `ACCESS_DENIED`，说明对象存储需要认证。

## 常见问题

### 问题 1: 密码验证失败

**症状**: `passwordCheck.isPasswordValid` 为 `false`

**解决方案**:

1. 使用脚本重置密码：

```bash
node scripts/reset-password.js hhwenhua@outlook.com
```

如果脚本不存在，创建一个：

```bash
cat > scripts/reset-password.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;
const email = process.argv[2];
const newPassword = '123456'; // 默认密码

async function resetPassword() {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' }
  });

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (!user) {
    console.error('用户不存在');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', user.id);

  if (error) {
    console.error('重置密码失败:', error);
    process.exit(1);
  }

  console.log('✅ 密码已重置为:', newPassword);
}

resetPassword();
EOF

node scripts/reset-password.js hhwenhua@outlook.com
```

### 问题 2: 对象存储 AccessDenied

**症状**: `uploadTest.errorType` 为 `ACCESS_DENIED`

**原因**: 对象存储 SDK 需要认证，但当前配置中 `accessKey` 和 `secretKey` 都是空字符串。

**解决方案**:

方案 1: 检查 Vercel 环境变量配置
```
COZE_BUCKET_ENDPOINT_URL
COZE_BUCKET_NAME
```

方案 2: 检查 coze-coding-dev-sdk 文档，确认是否需要额外的认证配置

方案 3: 如果问题持续，可以考虑：
1. 检查对象存储端点 URL 是否正确
2. 检查网络连接是否正常
3. 联系对象存储服务提供商

### 问题 3: 管理员接口返回 403

**症状**: `/api/admin/users` 返回 403

**原因**: Token 验证失败或权限不足

**解决方案**:

1. 检查用户角色：
```bash
curl "https://hanhai.cloud/api/diagnostics/user-check?email=hhwenhua@outlook.com"
```

2. 检查是否为管理员：
```bash
# 查看角色列表
# 应该有 "admin" 角色
```

3. 重新登录：
- 清除浏览器缓存 (Ctrl + Shift + R)
- 退出登录
- 重新登录

4. 检查 Token 是否过期：
- 在浏览器开发者工具中查看 localStorage 中的 `auth_token`
- 如果 token 很旧（超过 7 天），需要重新登录

## 重置密码

### 方法 1: 使用脚本

```bash
node scripts/reset-password.js hhwenhua@outlook.com
```

### 方法 2: 使用 SQL

在 Supabase Dashboard 中执行：

```sql
-- 生成新密码哈希（密码: 123456）
UPDATE users
SET password_hash = '$2a$10$ojUWdD.3TqWeGhikqJbHEu9pm6eCJ6xN5aqORpAyEMGuTpcdkdXdy'
WHERE email = 'hhwenhua@outlook.com';
```

### 方法 3: 使用 Node.js

```bash
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('123456', 10).then(hash => {
  console.log('新密码哈希:', hash);
});
"
```

然后手动更新数据库。

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

1. 用户信息诊断结果
2. 密码验证诊断结果
3. 对象存储诊断结果
4. Vercel 实时日志
5. 浏览器开发者工具中的错误信息

---

**最后更新**: 2026-03-06
**相关提交**: dfd2d6f
