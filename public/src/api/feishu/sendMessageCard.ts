/**
 * 飞书消息卡片发送API模块
 * 提供发送消息卡片到指定会话的功能
 * 文档地址: https://open.larkoffice.com/document/client-docs/gadget/-web-app-api/open-ability/chat/sendmessagecard
 */

// 导入日志工具
import { getPubKey } from '.';
import { log, logError } from '../../components/LogDisplay';
import { encrypt } from '../../crypto/keyGeneration';
import CacheService from '../../utils/cache';
import { getTriggerCode } from './messageDetail';

/**
 * 选择会话参数接口
 */
interface ChooseChatParams {
  allowCreateGroup?: boolean;
  multiSelect?: boolean;
  externalChat?: boolean;
  confirmTitle?: string;
}

/**
 * 卡片内容接口
 */
interface CardContent {
  msg_type: 'interactive';
  update_multi?: boolean;
  card: {
    config?: {
      wide_screen_mode?: boolean;
    };
    header?: {
      title: {
        tag: 'plain_text';
        content: string;
      };
      type?: string;
    };
    elements: Array<{
      tag: string;
      [key: string]: any;
    }>;
  };
}

/**
 * 发送消息卡片选项接口
 */
interface SendMessageCardOptions {
  shouldChooseChat: boolean;
  chooseChatParams?: ChooseChatParams;
  openChatIDs?: string[];
  openIDs?: string[];
  triggerCode?: string;
  cardContent?: CardContent;
  withAdditionalMessage?: boolean;
}

export async function newMessageCard(sessionId: string, friendOpenId: string, symmetricKey: string): Promise<any> {
  const header = `'新会话'#${sessionId}`

  try {
    const friendPubKey = await getPubKey(friendOpenId)
    if (!friendPubKey) {
      throw new Error('未找到好友公钥')
    }
    const encryptedContent = await encrypt(symmetricKey, friendPubKey, 'rsa')
    return sendMessageCardV2(header, encryptedContent)
  } catch (error) {
    logError(`[newMessageCard] 获取好友公钥失败: ${(error as Error).message}`)
    throw error
  }
}

export async function replyMessageCard(sessionId: string, content: string): Promise<any> {
  const header = `'回信'#${sessionId}`
  const symmetricKey = CacheService.get<string>(sessionId)
  if (!symmetricKey) {
    throw new Error('未找到会话密钥')
  }
  return sendMessageCardV2(header, content)
}

export async function sendMessageCardV3(type: '新会话' | '回信', sessionId: string, content: string): Promise<any> {
  const header = `${type}#${sessionId}`
  return sendMessageCardV2(header, content)
}

export async function sendMessageCardV2(header: string, content: string): Promise<any> {
  const cardContent: CardContent = {
    msg_type: 'interactive',
    update_multi: false,
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: header
        }
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'plain_text',
            content: content
          }
        }
      ]
    }
  };
  return sendMessageCard({
    shouldChooseChat: false,
    cardContent: cardContent
  })
}

/**
 * 发送消息卡片到指定会话
 * @param options 发送消息卡片的选项
 * @returns 发送结果
 */
export async function sendMessageCard(options: SendMessageCardOptions): Promise<any> {
  const triggerCode = await getTriggerCode()
  options.triggerCode = triggerCode

  return new Promise((resolve, reject) => {
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined') {
      // 检查飞书JSAPI是否加载
      if (window.h5sdk) {
        window.h5sdk.ready(() => {
          log(`[sendMessageCard] 开始发送消息卡片, triggerCode: ${options.triggerCode}`);
          log(`[sendMessageCard] 选项: ${JSON.stringify(options)}`);

          // 调用飞书JSAPI发送消息卡片
          window.tt.sendMessageCard(
            {
              // 是否在选择会话页面中发送卡片
              shouldChooseChat: options.shouldChooseChat,
              // 选择会话的入参
              chooseChatParams: options.chooseChatParams || undefined,
              // 会话的open_chat_id列表
              openChatIDs: options.openChatIDs || undefined,
              // 用户的open_id列表
              openIDs: options.openIDs || undefined,
              // 触发码
              triggerCode: options.triggerCode || undefined,
              // 消息卡片内容
              cardContent: options.cardContent || {
                msg_type: 'interactive',
                update_multi: false,
                card: {
                  elements: []
                }
              },
              success(res: any) {
                log(`[sendMessageCard] 发送消息卡片成功: ${JSON.stringify(res)}`);
                resolve(res);
              },
              // 失败回调
              fail(res: any) {
                logError(`[sendMessageCard] 发送消息卡片失败: ${JSON.stringify(res)}`);
                reject(new Error(`[sendMessageCard] 发送消息卡片失败: ${res.errMsg || JSON.stringify(res)}`));
              }
            }

          );
        });
      } else {
        const errorMsg = '飞书JSAPI未加载';
        console.error(errorMsg);
        logError(`[sendMessageCard] ${errorMsg}`);
        reject(new Error(errorMsg));
      }
    } else {
      const errorMsg = '非浏览器环境，无法发送消息卡片';
      console.error(errorMsg);
      logError(`[sendMessageCard] ${errorMsg}`);
      reject(new Error(errorMsg));
    }
  });
}

/**
 * 创建标准消息卡片内容
 * @param title 卡片标题
 * @param elements 卡片元素
 * @param updateMulti 是否共享卡片
 * @returns 卡片内容对象
 */
export function createCardContent(
  title: string,
  elements: Array<{
    tag: string;
    [key: string]: any;
  }>,
  updateMulti: boolean = false
): CardContent {
  return {
    msg_type: 'interactive',
    update_multi: updateMulti,
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: title
        },
        type: 'blue'
      },
      elements: elements
    }
  };
}

/**
 * 创建文本元素
 * @param content 文本内容
 * @param isBold 是否加粗
 * @returns 文本元素对象
 */
export function createTextElement(
  content: string,
  isBold: boolean = false
): { [key: string]: any } {
  return {
    tag: 'div',
    text: {
      tag: isBold ? 'bold' : 'plain_text',
      content: content
    }
  };
}

/**
 * 创建按钮元素
 * @param text 按钮文本
 * @param value 按钮值
 * @param type 按钮类型
 * @returns 按钮元素对象
 */
export function createButtonElement(
  text: string,
  value: string,
  type: 'default' | 'primary' | 'danger' = 'default'
): { [key: string]: any } {
  return {
    tag: 'button',
    text: {
      tag: 'plain_text',
      content: text
    },
    value: value,
    type: type
  };
}

/**
 * 创建图片元素
 * @param imageKey 图片key
 * @param alt 图片alt文本
 * @param title 图片标题
 * @returns 图片元素对象
 */
export function createImageElement(
  imageKey: string,
  alt: string = '',
  title: string = ''
): { [key: string]: any } {
  return {
    tag: 'img',
    image_key: imageKey,
    alt: alt,
    title: title
  };
}

/**
 * 创建分割线元素
 * @returns 分割线元素对象
 */
export function createDividerElement(): { [key: string]: any } {
  return {
    tag: 'divider'
  };
}