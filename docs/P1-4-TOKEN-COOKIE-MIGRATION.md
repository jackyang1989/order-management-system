# P1-4: Token 存储优化 - httpOnly Cookie 迁移

## 概述

将 JWT token 从 localStorage 迁移到 httpOnly cookie，提升安全性，防止 XSS 攻击窃取 token。

## 后端修改（已完成）

### 1. 安装依赖

```bash
cd backend
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

### 2. 修改的文件

#### ✅ [backend/src/main.ts](backend/src/main.ts#L7)
- 添加 `cookie-parser` 中间件
- 在第 32 行添加：`app.use(cookieParser());`

#### ✅ [backend/src/auth/auth.controller.ts](backend/src/auth/auth.controller.ts)
- 修改 `login` 接口：设置 httpOnly cookie，不在响应体返回 token
- 修改 `register` 接口：设置 httpOnly cookie
- 修改 `sms-login` 接口：设置 httpOnly cookie
- 添加 `logout` 接口：清除 cookie

**Cookie 配置**:
```typescript
res.cookie('accessToken', token, {
  httpOnly: true,                              // 防止 JavaScript 访问
  secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
  sameSite: 'strict',                          // 防止 CSRF 攻击
  maxAge: 7 * 24 * 60 * 60 * 1000,            // 7 天过期
});
```

#### ✅ [backend/src/auth/jwt.strategy.ts](backend/src/auth/jwt.strategy.ts#L34-L46)
- 添加 `extractJwtFromRequest` 函数
- 优先从 cookie 中读取 token
- 兼容旧版：从 Authorization header 中读取

### 3. 商家登录接口

还需要修改商家登录接口，使其也支持 httpOnly cookie：
- `backend/src/merchants/merchants.controller.ts` - login 和 register 方法

### 4. 管理员登录接口

还需要修改管理员登录接口：
- `backend/src/admin-users/admin-users.controller.ts` - login 方法

## 前端修改（待完成）

### 1. 移除 localStorage token 存储

需要修改以下文件：
- 登录成功后不再保存 token 到 localStorage
- 移除所有 `localStorage.setItem('token', ...)` 调用
- 移除所有 `localStorage.getItem('token')` 调用

### 2. 修改 API 请求配置

需要修改 axios 配置：
```typescript
// 修改前
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// 修改后
axios.defaults.withCredentials = true; // 允许发送 cookie
// 不再需要手动设置 Authorization header
```

### 3. 修改登出逻辑

```typescript
// 修改前
localStorage.removeItem('token');

// 修改后
await axios.post('/auth/logout'); // 调用后端清除 cookie
```

## 安全性提升

### httpOnly Cookie 的优势

1. **防止 XSS 攻击窃取 token**
   - JavaScript 无法访问 httpOnly cookie
   - 即使网站存在 XSS 漏洞，攻击者也无法窃取 token

2. **自动发送**
   - 浏览器自动在每个请求中发送 cookie
   - 不需要前端手动管理 token

3. **CSRF 防护**
   - `sameSite: 'strict'` 防止跨站请求伪造
   - 只有同源请求才会发送 cookie

4. **HTTPS 保护**
   - 生产环境 `secure: true` 确保只通过 HTTPS 传输
   - 防止中间人攻击

### localStorage 的安全问题

1. **XSS 攻击风险**
   - 任何 JavaScript 代码都可以访问 localStorage
   - 第三方脚本、浏览器插件都可能窃取 token

2. **持久化存储**
   - localStorage 永久存储，除非手动清除
   - 增加了 token 泄露的时间窗口

## 兼容性说明

当前实现保持了向后兼容：
- JWT 策略同时支持 cookie 和 Authorization header
- 旧版前端仍可使用 Authorization header
- 新版前端使用 httpOnly cookie

## 测试清单

### 后端测试
- [ ] 登录成功后 cookie 正确设置
- [ ] cookie 包含正确的安全属性（httpOnly, secure, sameSite）
- [ ] 登出后 cookie 被清除
- [ ] 受保护的接口可以从 cookie 中读取 token
- [ ] 受保护的接口仍支持 Authorization header（兼容性）

### 前端测试
- [ ] 登录成功后不再保存 token 到 localStorage
- [ ] API 请求自动携带 cookie
- [ ] 登出后 cookie 被清除
- [ ] 刷新页面后仍保持登录状态
- [ ] 跨域请求正确配置 credentials

## 部署注意事项

### 环境变量
确保设置以下环境变量：
```bash
NODE_ENV=production  # 生产环境启用 secure cookie
JWT_SECRET=<strong-random-secret>  # 至少 32 字符
```

### CORS 配置
确保后端 CORS 配置允许 credentials：
```typescript
app.enableCors({
  origin: ['https://yourdomain.com'],
  credentials: true,  // 必须设置为 true
});
```

### 前端配置
确保前端 API 请求配置：
```typescript
axios.defaults.withCredentials = true;
```

## 性能影响

- **无性能损失**：cookie 自动发送，不增加额外请求
- **减少前端代码**：不需要手动管理 token 存储和读取
- **更好的用户体验**：刷新页面不会丢失登录状态

## 回滚方案

如果需要回滚到 localStorage 方案：
1. 恢复 auth.controller.ts 中的 token 返回
2. 移除 cookie 设置代码
3. 恢复 jwt.strategy.ts 中的 `ExtractJwt.fromAuthHeaderAsBearerToken()`
4. 前端恢复 localStorage 存储逻辑
