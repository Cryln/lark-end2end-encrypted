/**
 * 飞书消息提示API模块
 * 提供显示消息提示的功能
 * 文档地址: https://open.larkoffice.com/document/client-docs/gadget/-web-app-api/interface/interaction-feedback/showtoast
 */

// 导入日志工具
import { log, logError } from '../../components/LogDisplay';

/**
 * 提示级别类型
 */
type ToastLevel = 'success' | 'error' | 'info' | 'warning' | 'loading';

/**
 * 显示消息提示
 * @param message 消息内容
 * @param level 提示级别
 * @returns 显示结果
 */
export function showToast(message: string, level: ToastLevel = 'info'): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined') {
      // 检查飞书JSAPI是否加载
      if (window.h5sdk) {
        window.h5sdk.ready(() => {
          log(`[showToast] 开始显示消息提示: ${message}, 级别: ${level}`);

          // 调用飞书JSAPI显示消息提示
          window.tt.showToast({
            title: message,
            duration: 2000,
            icon: level,
            mask: false,
            success(res: any) {
              log(`[showToast] 显示消息提示成功: ${JSON.stringify(res)}`);
              resolve();
            },
            fail(res: any) {
              logError(`[showToast] 显示消息提示失败: ${JSON.stringify(res)}`);
              reject(new Error(`[showToast] 显示消息提示失败: ${res.errMsg || JSON.stringify(res)}`));
            }
          });
        });
      } else {
        const errorMsg = '飞书JSAPI未加载';
        console.error(errorMsg);
        logError(`[showToast] ${errorMsg}`);
        reject(new Error(errorMsg));
      }
    } else {
      const errorMsg = '非浏览器环境，无法显示消息提示';
      console.error(errorMsg);
      logError(`[showToast] ${errorMsg}`);
      reject(new Error(errorMsg));
    }
  });
}