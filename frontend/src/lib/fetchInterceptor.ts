/**
 * 全局 Fetch 拦截器
 * 确保所有 fetch 请求都携带 credentials: 'include'
 * 这是全站统一 httpOnly Cookie 认证方案的关键部分
 */

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;

  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // 确保所有请求都携带 credentials: 'include'
    const newInit: RequestInit = {
      ...init,
      credentials: 'include',
    };

    return originalFetch(input, newInit);
  };
}

export {};
