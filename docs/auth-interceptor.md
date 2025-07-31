# 认证拦截器使用说明

## 概述

认证拦截器是Halo主题Sakura的一个安全功能，用于禁止未登录用户访问页面。当用户未登录时，系统会自动重定向到登录页面。

## 功能特性

- 🔒 **全局拦截**: 拦截所有页面访问，确保只有登录用户才能访问
- 🎯 **智能路径控制**: 可配置允许访问的路径和排除的路径
- 🔄 **PJAX兼容**: 完全兼容PJAX页面跳转
- ⚙️ **灵活配置**: 通过主题设置面板进行配置
- 🎨 **美观提示**: 提供美观的登录提示界面

## 配置说明

### 启用认证拦截器

1. 进入Halo管理后台
2. 进入主题设置
3. 找到"安全设置"部分
4. 勾选"启用认证拦截器"

### 配置选项

#### 登录页面URL
- **默认值**: `/login`
- **说明**: 用户未登录时重定向的登录页面地址

#### 允许访问的路径
- **默认值**: `/login,/register,/forgot-password,/api,/assets,/static`
- **说明**: 未登录用户允许访问的路径，多个路径用逗号分隔

#### 排除的路径
- **默认值**: `/api,/assets,/static`
- **说明**: 完全排除认证检查的路径，多个路径用逗号分隔

## 工作原理

### 认证状态检测

系统通过以下方式检测用户登录状态：

1. **DOM元素检测**: 检查页面中的认证标识元素
2. **API检测**: 通过Halo API检查用户信息
3. **配置检测**: 根据主题配置判断

### 拦截机制

1. **页面加载拦截**: 页面加载时检查认证状态
2. **PJAX拦截**: PJAX页面跳转时进行拦截
3. **链接点击拦截**: 拦截所有内部链接点击
4. **表单提交拦截**: 拦截表单提交操作

### 重定向流程

1. 检测到未登录用户访问受保护页面
2. 显示美观的登录提示界面
3. 2秒后自动重定向到登录页面
4. 登录成功后返回原页面

## 技术实现

### 核心文件

- `src/utils/authInterceptor.ts` - 认证拦截器核心逻辑
- `src/utils/pjaxAuthInterceptor.ts` - PJAX认证拦截器
- `src/css/common/components/auth-interceptor.css` - 样式文件
- `src/module/events.ts` - 事件集成

### 主要类

#### AuthInterceptor
- 单例模式实现
- 认证状态管理
- 路径检查逻辑
- 重定向处理

#### PjaxAuthInterceptor
- PJAX事件监听
- 链接和表单拦截
- 与AuthInterceptor协作

## 自定义配置

### 添加允许路径

```typescript
// 在主题设置中添加路径
const authInterceptor = AuthInterceptor.getInstance();
authInterceptor.addAllowedPath('/public-page');
```

### 添加排除路径

```typescript
// 在主题设置中添加排除路径
const authInterceptor = AuthInterceptor.getInstance();
authInterceptor.addExcludedPath('/public-api');
```

### 自定义登录URL

```typescript
// 设置自定义登录URL
const authInterceptor = AuthInterceptor.getInstance();
authInterceptor.setLoginUrl('/custom-login');
```

## 注意事项

1. **性能考虑**: 认证检查会略微影响页面加载速度
2. **缓存问题**: 确保登录状态正确缓存和更新
3. **API依赖**: 依赖Halo的用户API，确保API可用
4. **路径配置**: 仔细配置允许和排除路径，避免误拦截

## 故障排除

### 常见问题

1. **误拦截**: 检查允许路径配置是否正确
2. **循环重定向**: 确保登录页面在允许路径中
3. **样式问题**: 检查CSS文件是否正确加载
4. **API错误**: 检查Halo API是否正常工作

### 调试方法

1. 打开浏览器开发者工具
2. 查看控制台日志
3. 检查网络请求
4. 验证认证状态

## 更新日志

### v1.0.0
- 初始版本发布
- 基础认证拦截功能
- PJAX兼容性
- 主题设置集成 