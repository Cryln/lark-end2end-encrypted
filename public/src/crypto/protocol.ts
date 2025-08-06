/**
 * 应用层协议消息类型
 */
// 使用export关键字直接导出类型
export type ProtocolMessage = {
  method: string;
  pub_key: string;
  data: string;
};

/**
 * 协议处理器接口
 */
interface ProtocolHandler {
  (message: ProtocolMessage): Promise<void>;
}

/**
 * 协议路由管理器
 */
export class ProtocolRouter {
  private handlers: Record<string, ProtocolHandler> = {};

  /**
   * 注册协议处理器
   * @param method - 方法名
   * @param handler - 处理函数
   */
  register(method: string, handler: ProtocolHandler): void {
    this.handlers[method] = handler;
  }

  /**
   * 处理协议消息
   * @param message - 协议消息
   */
  async handle(message: ProtocolMessage): Promise<void> {
    const handler = this.handlers[message.method];
    if (handler) {
      await handler(message);
    } else {
      console.error(`未找到处理方法: ${message.method}`);
      throw new Error(`不支持的方法: ${message.method}`);
    }
  }
}

/**
 * 创建默认的协议路由器
 */
export const createDefaultRouter = (): ProtocolRouter => {
  const router = new ProtocolRouter();

  // 注册默认处理器
  router.register('echo', async (message) => {
    console.log('收到回显消息:', message);
    // 空实现，仅打印日志
  });

  router.register('encrypt', async (message) => {
    console.log('收到加密消息:', message);
    // 空实现，仅打印日志
  });

  router.register('decrypt', async (message) => {
    console.log('收到解密消息:', message);
    // 空实现，仅打印日志
  });

  return router;
};