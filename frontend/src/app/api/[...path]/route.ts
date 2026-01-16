import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:6006';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const path = pathSegments.join('/');
  const url = `${BACKEND_URL}/${path}`;

  // 获取查询参数
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${url}?${searchParams}` : url;

  // 准备请求头
  const headers: HeadersInit = {};

  // 复制重要的请求头
  const headersToForward = [
    'content-type',
    'authorization',
    'accept',
    'accept-language',
    'user-agent',
  ];

  headersToForward.forEach(header => {
    const value = request.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  });

  // 转发 Cookie
  const cookies = request.headers.get('cookie');
  if (cookies) {
    headers['cookie'] = cookies;
  }

  // 准备请求体
  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const text = await request.text();
      if (text) {
        body = text;
      }
    } catch (e) {
      // 忽略空请求体
    }
  }

  try {
    // 发送请求到后端
    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
      credentials: 'include',
    });

    // 获取响应体
    const responseBody = await response.text();

    // 创建响应
    const nextResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
    });

    // 复制响应头（除了 set-cookie，需要特殊处理）
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // 跳过一些不应该转发的头
      if (
        lowerKey !== 'transfer-encoding' &&
        lowerKey !== 'connection' &&
        lowerKey !== 'keep-alive' &&
        lowerKey !== 'set-cookie'  // set-cookie 需要特殊处理
      ) {
        nextResponse.headers.set(key, value);
      }
    });

    // 特别处理 Set-Cookie 头 - 使用 raw() 方法获取所有 set-cookie 头
    const rawHeaders = response.headers.raw ? response.headers.raw() : {};
    const setCookies = rawHeaders['set-cookie'];
    if (setCookies && Array.isArray(setCookies)) {
      setCookies.forEach(cookie => {
        nextResponse.headers.append('set-cookie', cookie);
      });
    } else {
      // 降级方案：如果 raw() 不可用，使用 get()
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        nextResponse.headers.set('set-cookie', setCookieHeader);
      }
    }

    return nextResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { success: false, message: '代理请求失败' },
      { status: 500 }
    );
  }
}
