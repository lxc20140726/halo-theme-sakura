# 认证拦截器调试指南

## 问题描述

登录后依然出现"需要登录"弹窗，说明认证状态检测存在问题。

## 调试步骤

### 1. 检查控制台日志

打开浏览器开发者工具，查看Console标签页，应该能看到以下日志：

```
认证拦截器已启用
调试命令: window.authInterceptorDebug
开始API认证检查...
API检测: 用户已登录，用户名: [用户名]
认证状态检查完成: 已登录
用户已登录，允许访问: [当前路径]
```

如果看到"用户未登录"的日志，说明认证检测失败。

### 2. 使用调试命令

在浏览器控制台中输入以下命令进行调试：

```javascript
// 查看当前认证状态
window.authInterceptorDebug.getStatus()

// 查看详细调试信息
window.authInterceptorDebug.getDebugInfo()

// 手动刷新认证状态
window.authInterceptorDebug.refresh()

// 手动设置认证状态（临时调试用）
window.authInterceptorDebug.setStatus(true)  // 设置为已登录
window.authInterceptorDebug.setStatus(false) // 设置为未登录
```

### 3. 检查API响应

在Network标签页中查看 `/apis/api.halo.run/v1alpha1/users/profile` 请求：

1. 检查请求是否成功（状态码200）
2. 检查响应内容是否包含用户信息
3. 检查请求头是否包含正确的认证信息

### 4. 检查DOM元素

在Elements标签页中检查以下元素是否存在：

```javascript
// 检查认证相关元素
document.querySelector('[sec\\:authorize="isAuthenticated()"]')
document.querySelector('[sec\\:authorize="isAnonymous()"]')

// 检查用户菜单
document.querySelector('.header-user-menu')
document.querySelector('.herder-user-name-u')

// 检查登录/登出链接
document.querySelector('a[href*="login"]')
document.querySelector('a[href*="logout"]')
```

### 5. 常见问题及解决方案

#### 问题1: API请求失败
**症状**: 控制台显示"API认证检查失败"
**解决方案**: 
- 检查Halo API是否正常工作
- 确认用户已正确登录
- 检查网络连接

#### 问题2: DOM检测失败
**症状**: API检查成功但DOM检测失败
**解决方案**:
- 检查页面是否正确加载了用户信息
- 确认主题模板中的认证元素存在

#### 问题3: 缓存问题
**症状**: 登录后页面没有刷新
**解决方案**:
- 清除浏览器缓存
- 强制刷新页面 (Ctrl+F5)
- 在Halo后台清除主题缓存

#### 问题4: 配置问题
**症状**: 功能完全无法工作
**解决方案**:
- 检查主题设置中是否启用了认证拦截器
- 确认配置的路径是否正确
- 检查登录页面URL是否正确

### 6. 手动测试认证状态

在控制台中运行以下代码来手动测试：

```javascript
// 测试API认证
fetch('/apis/api.halo.run/v1alpha1/users/profile', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json'
  }
}).then(response => {
  console.log('API响应状态:', response.status);
  return response.json();
}).then(data => {
  console.log('API响应数据:', data);
}).catch(error => {
  console.error('API请求失败:', error);
});

// 测试DOM检测
console.log('认证元素:', document.querySelector('[sec\\:authorize="isAuthenticated()"]'));
console.log('匿名元素:', document.querySelector('[sec\\:authorize="isAnonymous()"]'));
console.log('用户信息:', document.querySelector('.herder-user-name-u')?.textContent);
```

### 7. 临时禁用功能

如果问题无法立即解决，可以临时禁用认证拦截器：

1. 进入Halo管理后台
2. 进入主题设置
3. 取消勾选"启用认证拦截器"
4. 保存设置

### 8. 收集调试信息

如果问题持续存在，请收集以下信息：

1. 浏览器控制台的完整日志
2. Network标签页中API请求的详细信息
3. 当前页面的URL
4. 浏览器类型和版本
5. 是否使用了无痕模式
6. 是否启用了浏览器扩展

### 9. 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

- 调试信息的截图
- 控制台日志的文本
- 问题发生的具体步骤
- 浏览器环境信息

## 预防措施

1. **定期检查**: 定期检查认证拦截器是否正常工作
2. **监控日志**: 关注控制台中的错误日志
3. **测试环境**: 在测试环境中先验证功能
4. **备份配置**: 保存正常的配置信息

## 更新日志

### v1.1.0 (当前版本)
- 改进了认证状态检测逻辑
- 添加了详细的调试日志
- 提供了调试工具和命令
- 增强了错误处理机制 