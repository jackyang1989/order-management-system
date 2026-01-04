import { Injectable, OnModuleDestroy } from '@nestjs/common';

/**
 * 内存缓存服务
 * 生产环境建议替换为 Redis
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private cache: Map<string, { value: any; expireAt: number | null }> =
    new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每分钟清理过期缓存
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒），0或不传表示永不过期
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expireAt = ttl && ttl > 0 ? Date.now() + ttl * 1000 : null;
    this.cache.set(key, { value, expireAt });
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (item.expireAt && Date.now() > item.expireAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * 获取或设置缓存
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 删除匹配前缀的缓存
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (item.expireAt && Date.now() > item.expireAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 获取缓存统计
   */
  stats(): { size: number; keys: string[] } {
    this.cleanup();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (item.expireAt && now > item.expireAt) {
        this.cache.delete(key);
      }
    }
  }

  // ============ 便捷方法 ============

  /**
   * 缓存用户信息
   */
  setUser(userId: string, user: any, ttl = 300): void {
    this.set(`user:${userId}`, user, ttl);
  }

  getUser(userId: string): any {
    return this.get(`user:${userId}`);
  }

  invalidateUser(userId: string): void {
    this.delete(`user:${userId}`);
  }

  /**
   * 缓存配置
   */
  setConfig(key: string, value: any): void {
    this.set(`config:${key}`, value, 600); // 配置缓存10分钟
  }

  getConfig(key: string): any {
    return this.get(`config:${key}`);
  }

  invalidateConfigs(): void {
    this.deleteByPrefix('config:');
  }

  /**
   * 缓存VIP等级
   */
  setVipLevel(type: string, level: number, data: any): void {
    this.set(`vip:${type}:${level}`, data, 3600);
  }

  getVipLevel(type: string, level: number): any {
    return this.get(`vip:${type}:${level}`);
  }

  /**
   * 缓存平台信息
   */
  setPlatform(code: string, data: any): void {
    this.set(`platform:${code}`, data, 3600);
  }

  getPlatform(code: string): any {
    return this.get(`platform:${code}`);
  }

  invalidatePlatforms(): void {
    this.deleteByPrefix('platform:');
  }

  /**
   * 缓存费率
   */
  setCommissionRate(key: string, rate: any): void {
    this.set(`commission:${key}`, rate, 1800);
  }

  getCommissionRate(key: string): any {
    return this.get(`commission:${key}`);
  }

  invalidateCommissionRates(): void {
    this.deleteByPrefix('commission:');
  }

  /**
   * 请求频率限制
   */
  checkRateLimit(key: string, limit: number, windowSeconds: number): boolean {
    const cacheKey = `ratelimit:${key}`;
    const current = this.get<number>(cacheKey) || 0;

    if (current >= limit) {
      return false;
    }

    this.set(cacheKey, current + 1, windowSeconds);
    return true;
  }

  /**
   * 锁（简单实现）
   */
  async lock(key: string, ttl = 30): Promise<boolean> {
    const lockKey = `lock:${key}`;
    if (this.has(lockKey)) {
      return false;
    }
    this.set(lockKey, true, ttl);
    return true;
  }

  unlock(key: string): void {
    this.delete(`lock:${key}`);
  }
}
