// 变量化 API 路径：禁止在代码中出现 http://localhost...
// 所有请求路径必须引用该变量
// 使用 Next.js 代理路径，避免跨域cookie问题
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
