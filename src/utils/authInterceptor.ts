import { sakura } from "../main";

/**
 * 认证拦截器
 * 用于检查用户登录状态，禁止未登录用户访问页面
 */
export class AuthInterceptor {
  private static instance: AuthInterceptor;
  private isAuthenticated: boolean = false;
  private loginUrl: string = '/login';
  private allowedPaths: string[] = ['/login', '/register', '/forgot-password'];
  private excludedPaths: string[] = ['/api', '/assets', '/static'];

  private constructor() {
    this.checkAuthStatus();
  }

  public static getInstance(): AuthInterceptor {
    if (!AuthInterceptor.instance) {
      AuthInterceptor.instance = new AuthInterceptor();
    }
    return AuthInterceptor.instance;
  }

  /**
   * 检查用户认证状态
   */
  private async checkAuthStatus(): Promise<void> {
    try {
      // 首先尝试通过API检查认证状态
      await this.checkAuthViaAPI();
      
      // 如果API检查失败，再尝试DOM检测
      if (!this.isAuthenticated) {
        this.checkAuthViaDOM();
      }
      
      console.log('认证状态检查完成:', this.isAuthenticated ? '已登录' : '未登录');
    } catch (error) {
      console.error('检查认证状态失败:', error);
      this.isAuthenticated = false;
    }
  }

  /**
   * 通过DOM元素检查认证状态
   */
  private checkAuthViaDOM(): void {
    try {
      // 检查页面中是否有认证信息
      const authElement = document.querySelector('[sec\\:authorize="isAuthenticated()"]');
      const anonymousElement = document.querySelector('[sec\\:authorize="isAnonymous()"]');
      
      // 检查用户菜单中的登录状态
      const userMenu = document.querySelector('.header-user-menu');
      const loginLink = userMenu?.querySelector('a[href*="login"]');
      const logoutLink = userMenu?.querySelector('a[href*="logout"]');
      
      // 检查是否有用户信息显示
      const userInfo = document.querySelector('.herder-user-name-u');
      
      if (authElement && !anonymousElement) {
        this.isAuthenticated = true;
        console.log('DOM检测: 发现认证元素，用户已登录');
      } else if (anonymousElement && !authElement) {
        this.isAuthenticated = false;
        console.log('DOM检测: 发现匿名元素，用户未登录');
      } else if (logoutLink && !loginLink) {
        this.isAuthenticated = true;
        console.log('DOM检测: 发现登出链接，用户已登录');
      } else if (loginLink && !logoutLink) {
        this.isAuthenticated = false;
        console.log('DOM检测: 发现登录链接，用户未登录');
      } else if (userInfo && userInfo.textContent && userInfo.textContent.trim() !== '') {
        this.isAuthenticated = true;
        console.log('DOM检测: 发现用户信息，用户已登录');
      } else {
        // 如果都没有明确的标识，默认为未登录
        this.isAuthenticated = false;
        console.log('DOM检测: 未找到明确的认证标识，默认为未登录');
      }
    } catch (error) {
      console.error('DOM认证检查失败:', error);
      this.isAuthenticated = false;
    }
  }

  /**
   * 通过API检查认证状态
   */
  private async checkAuthViaAPI(): Promise<void> {
    try {
      console.log('开始API认证检查...');
      
      const response = await fetch('/apis/api.halo.run/v1alpha1/users/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData && userData.metadata && userData.metadata.name) {
          this.isAuthenticated = true;
          console.log('API检测: 用户已登录，用户名:', userData.metadata.name);
        } else {
          this.isAuthenticated = false;
          console.log('API检测: 响应数据无效');
        }
      } else {
        this.isAuthenticated = false;
        console.log('API检测: 响应状态码:', response.status);
      }
    } catch (error) {
      console.error('API认证检查失败:', error);
      this.isAuthenticated = false;
    }
  }

  /**
   * 检查当前路径是否允许访问
   */
  private isPathAllowed(path: string): boolean {
    // 从主题配置中获取允许的路径和排除的路径
    const allowedPathsConfig = sakura.getThemeConfig("security", "allowed_paths", String)?.valueOf();
    const excludedPathsConfig = sakura.getThemeConfig("security", "excluded_paths", String)?.valueOf();
    
    // 解析配置的路径
    const configAllowedPaths = allowedPathsConfig ? allowedPathsConfig.split(',').map(p => p.trim()) : this.allowedPaths;
    const configExcludedPaths = excludedPathsConfig ? excludedPathsConfig.split(',').map(p => p.trim()) : this.excludedPaths;
    
    // 检查是否在排除路径中
    for (const excludedPath of configExcludedPaths) {
      if (path.startsWith(excludedPath)) {
        return true;
      }
    }

    // 检查是否在允许路径中
    for (const allowedPath of configAllowedPaths) {
      if (path === allowedPath || path.startsWith(allowedPath + '/')) {
        return true;
      }
    }

    return false;
  }

  /**
   * 拦截页面访问
   */
  public async intercept(): Promise<void> {
    const currentPath = window.location.pathname;
    
    // 如果路径允许访问，直接返回
    if (this.isPathAllowed(currentPath)) {
      console.log('路径允许访问:', currentPath);
      return;
    }

    // 重新检查认证状态
    await this.refreshAuthStatus();

    // 如果用户未登录，重定向到登录页面
    if (!this.isAuthenticated) {
      console.log('用户未登录，准备重定向到登录页面');
      this.redirectToLogin();
    } else {
      console.log('用户已登录，允许访问:', currentPath);
    }
  }

  /**
   * 刷新认证状态
   */
  public async refreshAuthStatus(): Promise<void> {
    console.log('刷新认证状态...');
    await this.checkAuthStatus();
  }

  /**
   * 重定向到登录页面
   */
  private redirectToLogin(): void {
    const currentUrl = encodeURIComponent(window.location.href);
    
    // 从主题配置中获取登录URL
    const configLoginUrl = sakura.getThemeConfig("security", "login_url", String)?.valueOf();
    const loginUrl = configLoginUrl || this.loginUrl;
    
    const redirectUrl = `${loginUrl}?redirect_uri=${currentUrl}`;
    
    // 显示提示信息
    this.showLoginRequiredMessage();
    
    // 延迟重定向，让用户看到提示信息
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 2000);
  }

  /**
   * 显示登录要求提示
   */
  private showLoginRequiredMessage(): void {
    // 检查是否已经存在提示
    if (document.getElementById('auth-interceptor-message')) {
      return;
    }

    // 创建提示元素
    const messageDiv = document.createElement('div');
    messageDiv.id = 'auth-interceptor-message';
    messageDiv.innerHTML = `
      <div class="auth-message">
        <h3>🔒 需要登录</h3>
        <p>您需要登录后才能访问此页面</p>
        <div class="redirect-text">
          正在跳转到登录页面<span class="loading-dots"></span>
        </div>
        <div style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
          调试信息: 认证状态检测失败，请检查控制台日志
        </div>
      </div>
    `;
    
    document.body.appendChild(messageDiv);
  }

  /**
   * 设置登录URL
   */
  public setLoginUrl(url: string): void {
    this.loginUrl = url;
  }

  /**
   * 添加允许的路径
   */
  public addAllowedPath(path: string): void {
    if (!this.allowedPaths.includes(path)) {
      this.allowedPaths.push(path);
    }
  }

  /**
   * 添加排除的路径
   */
  public addExcludedPath(path: string): void {
    if (!this.excludedPaths.includes(path)) {
      this.excludedPaths.push(path);
    }
  }

  /**
   * 获取认证状态
   */
  public getAuthStatus(): boolean {
    return this.isAuthenticated;
  }

  /**
   * 手动更新认证状态
   */
  public updateAuthStatus(status: boolean): void {
    this.isAuthenticated = status;
    console.log('手动更新认证状态:', status ? '已登录' : '未登录');
  }

  /**
   * 获取调试信息
   */
  public getDebugInfo(): any {
    return {
      isAuthenticated: this.isAuthenticated,
      loginUrl: this.loginUrl,
      allowedPaths: this.allowedPaths,
      excludedPaths: this.excludedPaths,
      currentPath: window.location.pathname,
      userAgent: navigator.userAgent
    };
  }
} 