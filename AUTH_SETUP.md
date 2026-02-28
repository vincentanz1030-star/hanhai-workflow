# 认证系统配置指南

## 1. Supabase 项目设置

### 1.1 创建 Supabase 项目
1. 访问 https://supabase.com
2. 创建一个新项目
3. 记录项目的 URL 和 anon key

### 1.2 执行数据库脚本
在 Supabase Dashboard 的 SQL Editor 中执行 `supabase/create_profiles.sql` 文件中的 SQL 脚本，创建 profiles 表。

### 1.3 配置环境变量
在项目根目录创建 `.env.local` 文件，并添加以下配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

你可以从 Supabase Dashboard 的 **Settings > API** 中获取这些值。

### 1.4 配置邮箱认证
1. 在 Supabase Dashboard 中，进入 **Authentication > Providers**
2. 启用 Email provider
3. 配置邮件设置（可选，用于发送验证和重置邮件）

## 2. 功能说明

### 2.1 用户注册
- 访问 `/register` 页面
- 填写姓名、邮箱和密码
- 提交后系统会创建用户账号和 profiles 记录
- 如果启用了邮箱验证，用户需要先验证邮箱才能登录

### 2.2 用户登录
- 访问 `/login` 页面
- 输入邮箱和密码
- 登录成功后自动跳转到首页

### 2.3 退出登录
- 在首页右上角点击退出登录按钮
- 自动跳转到登录页面

### 2.4 忘记密码
- 访问 `/forgot-password` 页面
- 输入注册邮箱
- 系统会发送密码重置邮件
- 点击邮件中的链接跳转到 `/reset-password` 页面
- 输入新密码完成重置

### 2.5 路由守卫
- 首页（`/`）需要登录才能访问
- 未登录用户会自动跳转到登录页面
- 已登录用户访问登录/注册页面会自动跳转到首页

## 3. 数据库表结构

### profiles 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 用户ID，关联 auth.users |
| email | TEXT | 用户邮箱 |
| full_name | TEXT | 用户姓名 |
| brand_access | TEXT[] | 可访问的品牌列表 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 4. 开发说明

### 4.1 Supabase 客户端
```typescript
import { supabase } from '@/lib/supabase';

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser();

// 登出
await supabase.auth.signOut();
```

### 4.2 中间件
路由守卫在 `src/middleware.ts` 中实现，保护所有需要认证的页面。

### 4.3 环境变量
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名访问密钥

## 5. 注意事项

1. **安全性**：
   - 不要将 `service_role` key 暴露到前端
   - 使用 Row Level Security (RLS) 保护数据库数据
   - 所有环境变量都应该安全存储

2. **邮箱验证**：
   - 建议在生产环境启用邮箱验证
   - 配置 SMTP 服务器以发送邮件

3. **品牌访问控制**：
   - 可以通过 `profiles.brand_access` 字段控制用户可访问的品牌
   - 默认值为 `['all']`，允许访问所有品牌

4. **测试**：
   - 在开发环境中，可以使用临时邮箱测试注册流程
   - 生产环境必须配置真实的邮件服务

## 6. 后续扩展

可以考虑添加以下功能：
- 角色权限管理（管理员、普通用户等）
- 品牌访问权限的细化控制
- 用户头像上传
- 修改密码功能
- OAuth 登录（Google、GitHub 等）
- 双因素认证（2FA）
