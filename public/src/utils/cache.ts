/**
 * 基于localStorage的缓存工具
 * 提供全局缓存管理功能
 */
const CacheService = {
  /**
   * 设置缓存项
   * @param key 缓存键
   * @param value 缓存值
   * @param expire 过期时间(毫秒)，可选
   */
  set<T>(key: string, value: T, expire?: number): void {
    const data = {
      value,
      expire: expire ? Date.now() + expire : null
    };
    localStorage.setItem(key, JSON.stringify(data));
  },

  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期则返回null
   */
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      const data = JSON.parse(item);
      // 检查是否过期
      if (data.expire && Date.now() > data.expire) {
        this.remove(key);
        return null;
      }
      return data.value as T;
    } catch (error) {
      console.error('解析缓存项失败:', error);
      this.remove(key);
      return null;
    }
  },

  /**
   * 删除缓存项
   * @param key 缓存键
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * 清除所有缓存
   */
  clear(): void {
    localStorage.clear();
  },

  /**
   * 检查缓存项是否存在且未过期
   * @param key 缓存键
   * @returns 是否存在且未过期
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
};

export default CacheService;