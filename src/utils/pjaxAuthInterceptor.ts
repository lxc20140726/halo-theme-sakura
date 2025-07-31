import { AuthInterceptor } from './authInterceptor';
import { sakura } from '../main';

/**
 * PJAX认证拦截器
 * 用于在PJAX页面跳转时进行认证检查
 */
export class PjaxAuthInterceptor {
  private static instance: PjaxAuthInterceptor;
  private authInterceptor: AuthInterceptor;
  private isInitialized: boolean = false;

  private constructor() {
    this.authInterceptor = AuthInterceptor.getInstance();
  }

  public static getInstance(): PjaxAuthInterceptor {
    if (!PjaxAuthInterceptor.instance) {
      PjaxAuthInterceptor.instance = new PjaxAuthInterceptor();
    }
    return PjaxAuthInterceptor.instance;
  }

  /**
   * 初始化PJAX认证拦截器
   */
  public init(): void {
    if (this.isInitialized) {
      return;
    }

    // 监听PJAX发送事件
    window.addEventListener('pjax:send', this.handlePjaxSend.bind(this));
    
    // 监听PJAX成功事件
    window.addEventListener('pjax:success', this.handlePjaxSuccess.bind(this));
    
    // 监听PJAX错误事件
    window.addEventListener('pjax:error', this.handlePjaxError.bind(this));

    // 页面加载时进行认证检查
    this.checkAuthOnPageLoad();

    this.isInitialized = true;
    console.log('PJAX认证拦截器已初始化');
  }

  /**
   * 处理PJAX发送事件
   */
  private async handlePjaxSend(event: any): Promise<void> {
    const request = event.request as XMLHttpRequest;
    const url = new URL(request.responseURL || window.location.href);
    
    // 检查目标URL是否需要认证
    if (!this.authInterceptor.getAuthStatus() && !this.isPathAllowed(url.pathname)) {
      // 阻止PJAX请求
      event.preventDefault();
      event.stopPropagation();
      
      // 重定向到登录页面
      await this.authInterceptor.intercept();
    }
  }

  /**
   * 处理PJAX成功事件
   */
  private handlePjaxSuccess(_event: any): void {
    // 页面加载完成后重新检查认证状态
    setTimeout(() => {
      this.checkAuthOnPageLoad();
    }, 100);
  }

  /**
   * 处理PJAX错误事件
   */
  private handlePjaxError(event: any): void {
    const request = event.request as XMLHttpRequest;
    
    // 如果是401未授权错误，重定向到登录页面
    if (request.status === 401) {
      this.authInterceptor.intercept();
    }
  }

  /**
   * 页面加载时检查认证状态
   */
  private async checkAuthOnPageLoad(): Promise<void> {
    // 延迟检查，确保DOM已完全加载
    setTimeout(async () => {
      await this.authInterceptor.intercept();
    }, 200);
  }

  /**
   * 检查路径是否允许访问
   */
  private isPathAllowed(path: string): boolean {
    // 从主题配置中获取允许的路径和排除的路径
    const allowedPathsConfig = sakura.getThemeConfig("security", "allowed_paths", String)?.valueOf();
    const excludedPathsConfig = sakura.getThemeConfig("security", "excluded_paths", String)?.valueOf();
    
    // 解析配置的路径
    const configAllowedPaths = allowedPathsConfig ? allowedPathsConfig.split(',').map(p => p.trim()) : ['/login', '/register', '/forgot-password', '/api', '/assets', '/static'];
    const configExcludedPaths = excludedPathsConfig ? excludedPathsConfig.split(',').map(p => p.trim()) : ['/api', '/assets', '/static'];
    
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
   * 拦截所有链接点击
   */
  public interceptLinks(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        
        // 如果是内部链接且用户未登录
        if (url.origin === window.location.origin && 
            !this.authInterceptor.getAuthStatus() && 
            !this.isPathAllowed(url.pathname)) {
          
          event.preventDefault();
          this.authInterceptor.intercept();
        }
      }
    });
  }

  /**
   * 拦截表单提交
   */
  public interceptForms(): void {
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      
      if (form && form.action) {
        const url = new URL(form.action, window.location.origin);
        
        // 如果是内部表单且用户未登录
        if (url.origin === window.location.origin && 
            !this.authInterceptor.getAuthStatus() && 
            !this.isPathAllowed(url.pathname)) {
          
          event.preventDefault();
          this.authInterceptor.intercept();
        }
      }
    });
  }

  /**
   * 获取认证拦截器实例
   */
  public getAuthInterceptor(): AuthInterceptor {
    return this.authInterceptor;
  }
} 