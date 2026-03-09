# 瀚海集团工作流程管理系统 - 故障排查指南

本文档提供常见问题的排查步骤和解决方案。

---

## 🌐 网页打不开

### 症状
部署成功后，访问网页无法打开或显示错误。

### 排查步骤

#### 1. 检查服务是否启动

**开发环境**：
```bash
# 检查 5000 端口是否在监听
ss -ltnp | grep 5000
```

**部署环境**：
查看部署日志，确认是否有类似以下的输出：
```
Starting HTTP service on hostname 0.0.0.0 port 5000 for deploy...
✓ Environment variables loaded from .env.production
```

#### 2. 检查网络绑定

确保服务绑定到 `0.0.0.0`（所有网络接口），而不是 `127.0.0.1`（仅本地）。

**正确配置**：
- 环境变量：`HOSTNAME=0.0.0.0`
- 启动命令：`HOSTNAME=0.0.0.0 npx next start --port 5000`

**验证方法**：
```bash
# 检查监听地址
ss -ltnp | grep 5000

# 应该看到类似以下的输出：
# LISTEN 0  511  [::]:5000  [::]:*  users:(("node",pid=12345,fd=18))
```

#### 3. 检查防火墙设置

确保 5000 端口没有被防火墙阻止。

```bash
# 检查防火墙状态（Linux）
sudo ufw status

# 如果防火墙启用，允许 5000 端口
sudo ufw allow 5000
```

#### 4. 检查部署平台配置

如果使用部署平台（如 Coze），确保：
- 端口配置正确（应该是 5000）
- 网络策略允许外部访问
- 域名配置正确

#### 5. 检查环境变量

确保必需的环境变量已设置：
- `COZE_SUPABASE_URL`
- `COZE_SUPABASE_ANON_KEY`
- `JWT_SECRET`

#### 6. 查看服务日志

**开发环境**：
```bash
# 查看应用日志
tail -f logs/app.log

# 查看控制台日志
tail -f logs/console.log
```

**部署环境**：
查看部署平台的日志输出。

---

## 🔧 构建失败

### 症状
构建过程中出现错误。

### 常见错误

#### 1. 环境变量未设置

**错误信息**：
```
Error: COZE_SUPABASE_URL is not set
✗ Error: .env.production file not found
```

**解决方案**：
确保 `.env.production` 文件存在并包含必需的环境变量。

#### 2. TypeScript 类型错误

**错误信息**：
```
Type error: Property 'xxx' does not exist on type 'yyy'
```

**解决方案**：
```bash
# 运行类型检查
npx tsc --noEmit

# 根据错误信息修复代码
```

#### 3. 依赖安装失败

**错误信息**：
```
Error: Cannot find module 'xxx'
```

**解决方案**：
```bash
# 清理缓存并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 🔌 数据库连接问题

### 症状
应用无法连接到数据库。

### 排查步骤

#### 1. 检查环境变量
```bash
# 验证 Supabase 配置
echo "COZE_SUPABASE_URL: $COZE_SUPABASE_URL"
echo "COZE_SUPABASE_ANON_KEY: ${COZE_SUPABASE_ANON_KEY:0:30}..."
```

#### 2. 测试数据库连接
```bash
# 使用 curl 测试连接
curl -I $COZE_SUPABASE_URL
```

#### 3. 检查 Supabase 项目状态
- 登录 Supabase 控制台
- 确认项目是否暂停或超出配额
- 检查 API 密钥是否有效

---

## 🚀 性能问题

### 症状
应用响应缓慢或卡顿。

### 优化建议

#### 1. 检查数据库查询
- 使用 Supabase 的查询分析工具
- 优化慢查询
- 添加适当的索引

#### 2. 启用缓存
- 使用 React Query 或 SWR 进行数据缓存
- 启用 Next.js 的静态页面生成

#### 3. 优化构建
- 使用 `next build --no-lint` 跳过 lint 检查
- 使用 Turbopack 进行增量构建

---

## 🔐 认证问题

### 症状
用户无法登录或频繁登出。

### 排查步骤

#### 1. 检查 JWT Secret
确保 `JWT_SECRET` 环境变量已设置且值一致。

#### 2. 检查 Cookie 设置
确保 Cookie 配置正确：
```javascript
cookieStore.set('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7天
  path: '/',
});
```

#### 3. 检查用户状态
- 确认用户状态为 `active`
- 确认用户已通过管理员审核（如果启用审核功能）

---

## 📞 获取帮助

如果以上步骤都无法解决问题，请联系：
- 技术支持：support@hanhai.com
- 开发团队：dev@hanhai.com

**提供以下信息以加快问题解决速度**：
1. 完整的错误信息
2. 环境信息（操作系统、Node.js 版本等）
3. 复现步骤
4. 相关日志

---

**最后更新**: 2026-03-01
**版本**: 1.0
