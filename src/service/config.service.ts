import { MyData } from '../dto/req/kv';

/**
 * KV存储配置服务
 * 封装与Cloudflare KV的交互逻辑
 */
export class ConfigService {
  private readonly kvNamespace: KVNamespace;
  private readonly timeoutMs: number = 5000;

  constructor(kvNamespace: KVNamespace) {
    this.kvNamespace = kvNamespace;
  }

  /**
   * 存储配置到KV
   */
  async setConfig(data: MyData): Promise<void> {
    return Promise.race([
      this.kvNamespace.put(data.key, data.value),
      new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('KV set operation timed out')), this.timeoutMs)
      )
    ]);
  }

  /**
   * 从KV获取配置
   */
  async getConfig(key: string): Promise<string | null> {
    return Promise.race([
      this.kvNamespace.get(key),
      new Promise<string | null>((_, reject) => 
        setTimeout(() => reject(new Error('KV get operation timed out')), this.timeoutMs)
      )
    ]);
  }
}