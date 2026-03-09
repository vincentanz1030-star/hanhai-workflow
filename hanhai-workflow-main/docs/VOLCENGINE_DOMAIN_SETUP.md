# 火山引擎域名 + Vercel 部署完整指南

本指南将详细介绍如何在火山引擎购买域名，并配置到 Vercel 上，实现国内可访问的 Vercel 应用。

---

## 📋 准备工作

### 需要的账号
- ✅ 火山引擎账号（用于购买域名）
- ✅ Vercel 账号（已配置好项目）
- ✅ GitHub 账号（Vercel 关联的代码仓库）

---

## 第一步：在火山引擎购买域名

### 1.1 登录火山引擎

访问 [火山引擎官网](https://www.volcengine.com/)

登录您的账号，如果没有则先注册。

### 1.2 进入域名服务

1. 点击产品 → **域名服务**
2. 进入域名购买页面

### 1.3 选择域名

**域名选择建议：**

1. **域名后缀推荐**
   - `.com`（国际通用，最推荐）
   - `.cn`（国内首选，需要 ICP 备案）
   - `.net`（第二选择）

2. **域名命名建议**
   - 简短易记
   - 与项目相关
   - 避免特殊字符

**示例域名：**
- `hanhai-workflow.com`
- `hanhaiworkflow.cn`
- `hwcms.com`

### 1.4 购买域名

1. 搜索域名，检查是否可用
2. 选择购买年限（建议 1-3 年）
3. 填写域名所有者信息（实名认证）
4. 完成支付

**价格参考：**
- `.com`：约 ¥50-80/年
- `.cn`：约 ¥30-60/年

---

## 第二步：在 Vercel 添加自定义域名

### 2.1 访问 Vercel 项目

1. 访问 [vercel.com](https://vercel.com)
2. 登录您的账号
3. 进入 `hanhai-workflow` 项目

### 2.2 添加域名

1. 点击 **Settings** 标签
2. 找到 **Domains** 部分
3. 点击 **Add Domain** 按钮
4. 输入您购买的域名（如：`hanhai-workflow.com`）
5. 点击 **Add**

### 2.3 记录 DNS 信息

Vercel 会显示需要配置的 DNS 记录：

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

或者

Type: A
Name: @
Value: 76.76.21.21
```

**记录这些信息，下一步配置 DNS 时会用到。**

---

## 第三步：在火山引擎配置 DNS

### 3.1 进入域名管理

1. 回到火山引擎控制台
2. 进入 **域名服务**
3. 找到您购买的域名
4. 点击 **解析设置** 或 **DNS 管理**

### 3.2 添加 DNS 记录

**方式 1：使用 CNAME 记录（推荐）**

点击 **添加记录**，填写以下信息：

| 字段 | 值 | 说明 |
|------|-----|------|
| **记录类型** | `CNAME` | 选择 CNAME |
| **主机记录** | `@` | 表示根域名 |
| **记录值** | `cname.vercel-dns.com` | Vercel 提供的值 |
| **TTL** | `600` | 600 秒（10分钟） |

点击 **确认** 保存。

**方式 2：使用 A 记录**

| 字段 | 值 | 说明 |
|------|-----|------|
| **记录类型** | `A` | 选择 A |
| **主机记录** | `@` | 表示根域名 |
| **记录值** | `76.76.21.21` | Vercel 的 IP 地址 |
| **TTL** | `600` | 600 秒（10分钟） |

点击 **确认** 保存。

### 3.3 添加 www 子域名（可选）

如果您希望 `www.hanhai-workflow.com` 也能访问：

| 字段 | 值 | 说明 |
|------|-----|------|
| **记录类型** | `CNAME` | 选择 CNAME |
| **主机记录** | `www` | 表示 www 子域名 |
| **记录值** | `cname.vercel-dns.com` | Vercel 提供的值 |
| **TTL** | `600` | 600 秒（10分钟） |

---

## 第四步：在 Vercel 验证域名

### 4.1 检查域名状态

回到 Vercel 的 **Domains** 页面：

1. Vercel 会自动检测 DNS 记录
2. 通常需要 1-10 分钟
3. 状态会变为 **Valid Configuration** 或 **Pending**

### 4.2 手动验证

如果 Vercel 没有自动验证，可以手动触发：

1. 点击域名旁边的 **···** 按钮
2. 选择 **Refresh DNS Status**
3. 等待几秒钟

### 4.3 配置完成

当状态显示为 **Valid Configuration** 时，说明配置成功！

---

## 第五步：ICP 备案（可选但推荐）

### 什么是 ICP 备案？

ICP 备案是中国大陆的互联网信息服务备案制度。

### 是否需要备案？

| 域名类型 | 是否需要备案 |
|---------|------------|
| `.cn` 域名 | ✅ 必须备案 |
| `.com` 域名 | ❌ 可选，但建议备案 |

### 备案步骤（如果选择备案）

1. 在火山引擎控制台，进入 **ICP 备案** 服务
2. 点击 **开始备案**
3. 填写备案信息：
   - 主体信息（个人或企业）
   - 网站信息
   - 负责人信息
4. 上传证件照片
5. 提交审核
6. 等待审核通过（通常 1-3 周）

**注意：** 备案需要实名认证和身份验证。

---

## 第六步：访问应用

### 6.1 访问根域名

在浏览器中输入：
```
https://hanhai-workflow.com
```

### 6.2 访问 www 子域名

如果您配置了 www：
```
https://www.hanhai-workflow.com
```

### 6.3 验证功能

测试以下功能：
- ✅ 可以打开登录页面
- ✅ 可以注册新账号
- ✅ 可以登录系统
- ✅ 可以创建项目
- ✅ 品牌名称正确显示

---

## 🔧 高级配置

### 7.1 配置 HTTPS

Vercel 会自动为自定义域名配置 SSL 证书：

1. Vercel 自动申请 Let's Encrypt 证书
2. 证书自动续期
3. 无需手动配置

### 7.2 配置重定向

将 `http` 重定向到 `https`：

1. Vercel 会自动处理
2. 无需额外配置

### 7.3 配置环境变量

确保在 Vercel 项目中配置了以下环境变量：

**Vercel 项目 → Settings → Environment Variables**

| Name | Value | Environments |
|------|-------|-------------|
| `COZE_SUPABASE_URL` | `https://br-bonny-dunn-a5ffca3a.supabase2.aidap-global.cn-beijing.volces.com` | ✅ Production ✅ Preview ✅ Development |
| `COZE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTI0OTk3ODQsInJvbGUiOiJhbm9uIn0.ViaI7gA49j2TCrou2yW6xXtRc3B06M2GURcxcXga6Pg` | ✅ Production ✅ Preview ✅ Development |
| `JWT_SECRET` | `hanhai-workflow-secret-key-2024` | ✅ Production ✅ Preview ✅ Development |

---

## 🎯 完整流程总结

### 简化步骤

1. **购买域名**（火山引擎）
   - 搜索域名
   - 购买并实名认证

2. **添加域名**（Vercel）
   - Settings → Domains
   - 添加您的域名

3. **配置 DNS**（火山引擎）
   - 添加 CNAME 记录
   - 指向 `cname.vercel-dns.com`

4. **验证域名**（Vercel）
   - 等待 DNS 生效
   - Vercel 自动验证

5. **访问应用**
   - 通过自定义域名访问

---

## ⚠️ 常见问题

### Q1: DNS 配置后多久生效？

**A:** 通常 1-10 分钟，最多 24 小时。

### Q2: 如何检查 DNS 是否生效？

**A:** 使用 `nslookup` 或 `dig` 命令：

```bash
# Windows
nslookup hanhai-workflow.com

# Linux/Mac
dig hanhai-workflow.com

# 或使用在线工具
https://www.nslookup.io/
```

### Q3: Vercel 一直显示 Pending 怎么办？

**A:** 
1. 检查 DNS 记录是否正确
2. 等待更长时间（最多 24 小时）
3. 在 Vercel 手动刷新 DNS 状态
4. 检查域名是否已过期

### Q4: 可以使用免费域名吗？

**A:** 不推荐。免费域名通常不稳定，且可能无法通过 Vercel 验证。

### Q5: 可以使用二级域名吗？

**A:** 可以，但建议使用主域名更专业。

---

## 📊 费用预估

### 火山引擎费用

| 项目 | 费用 | 说明 |
|------|------|------|
| 域名费用 | ¥50-80/年 | .com 域名 |
| DNS 解析 | 免费 | 火山引擎提供 |
| ICP 备案 | 免费 | 可选 |

### Vercel 费用

| 项目 | 费用 | 说明 |
|------|------|------|
| 部署服务 | 免费 | 基础套餐 |
| SSL 证书 | 免费 | Let's Encrypt |
| 带宽 | 100GB/月 | 免费套餐 |

**总计：** 约 ¥50-80/年（仅域名费用）

---

## 🎉 配置完成

恭喜！您已经成功配置了火山引擎域名 + Vercel 的部署方案。

**现在您可以：**

1. ✅ 在国内直接访问应用
2. ✅ 享受 Vercel 的优质服务
3. ✅ 使用自定义专业域名
4. ✅ 自动 HTTPS 加密
5. ✅ 全球 CDN 加速

---

## 📞 获取帮助

如遇到问题，请提供以下信息：

1. 购买的域名
2. Vercel 项目的截图
3. DNS 配置截图
4. 具体的错误信息

我们会尽快帮助您解决！
