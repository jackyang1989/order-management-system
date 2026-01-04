/**
 * 安全的 fetch 封装
 * 处理 401 跳转登录，500 toast 提示，空数据返回空态
 */

export interface SafeFetchOptions extends RequestInit {
  showError?: boolean;
  redirectOnUnauthorized?: boolean;
}

export interface SafeFetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export async function safeFetch<T = any>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  const {
    showError = true,
    redirectOnUnauthorized = true,
    ...fetchOptions
  } = options;

  try {
    // 自动添加 Authorization header
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = new Headers(fetchOptions.headers || {});

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // 处理 401 未授权
    if (response.status === 401) {
      if (redirectOnUnauthorized && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return {
        success: false,
        error: '登录已过期，请重新登录',
        status: 401,
      };
    }

    // 处理 500 服务器错误
    if (response.status >= 500) {
      const errorMsg = '服务器错误，请稍后重试';
      if (showError && typeof window !== 'undefined') {
        // 简单的 toast 提示
        showToast(errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        status: response.status,
      };
    }

    // 处理其他错误
    if (!response.ok) {
      let errorMsg = '请求失败';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        // ignore parse error
      }
      return {
        success: false,
        error: errorMsg,
        status: response.status,
      };
    }

    // 解析响应
    const data = await response.json();

    // 如果后端返回的结构有 success 字段
    if (typeof data === 'object' && 'success' in data) {
      return {
        success: data.success,
        data: data.data,
        error: data.message,
        status: response.status,
      };
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '网络错误';
    if (showError && typeof window !== 'undefined') {
      showToast(errorMsg);
    }
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * 简单的 toast 提示
 */
function showToast(message: string, duration: number = 3000) {
  if (typeof window === 'undefined') return;

  // 移除已存在的 toast
  const existing = document.getElementById('safe-fetch-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'safe-fetch-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    animation: fadeIn 0.2s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/**
 * 空态组件生成器
 */
export function EmptyState({
  icon = '📭',
  message = '暂无数据',
}: {
  icon?: string;
  message?: string;
}) {
  return `
    <div style="text-align: center; padding: 60px 20px; color: #999;">
      <div style="font-size: 40px; margin-bottom: 10px;">${icon}</div>
      <div>${message}</div>
    </div>
  `;
}

export default safeFetch;
