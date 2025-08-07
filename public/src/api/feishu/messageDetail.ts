/**
 * 飞书消息详情API模块
 * 提供获取消息详情的功能
 */

// 导入日志工具
import { log, logError } from '../../components/LogDisplay';
import { GetMsgDetailResp } from '../../constants/types';




/**
 * 获取消息详情
 * @param triggerCode 触发码
 * @returns 消息详情
 */
export async function getBlockActionSourceDetail(): Promise<GetMsgDetailResp> {
  const triggerCode = getTriggerCode();
  return new Promise((resolve, reject) => {
    if (window.h5sdk) {
      window.h5sdk.ready(() => {
        // 调用方法，传入triggerCode，获取消息内容
        window.tt.getBlockActionSourceDetail({
          triggerCode: triggerCode,
          success(res: any) {
            log(`[getBlockActionSourceDetail] 获取消息详情成功: ${JSON.stringify(res)}`);
            resolve(res);
          },
          fail(res: any) {
            logError(`[getBlockActionSourceDetail] 获取消息详情失败: ${JSON.stringify(res)}`);
            reject(new Error(`[getBlockActionSourceDetail] 获取消息详情失败: ${res.errMsg}`));
          }
        });
      });
    } else {
      console.error('飞书JSAPI未加载');
      reject(new Error('飞书JSAPI未加载'));
    }
  });
}


export function getTriggerCode(): string {
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    log(`[initFeishuAPI] URL参数: ${searchParams.toString()}`);
    const launchAbility = searchParams.get('required_launch_ability');
    const from = searchParams.get('from');
    let isFromAction = false;
    // 检测用户代理
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isFromPc = /windows|macintosh|linux/.test(userAgent);
    const isFromMobile = /mobile|android|iphone|ipad|ipod/.test(userAgent);
    // 判断是否来自消息动作
    if (isFromMobile && launchAbility) {
      isFromAction = launchAbility === 'message_action';
    }
    if (isFromPc && from) {
      isFromAction = from === 'message_action';
    }
    log(`[initFeishuAPI] 消息动作: ${from}`);

    // 如果来自消息动作，则获取消息内容
    if (isFromAction) {
      log(`[initFeishuAPI] 开始获取消息内容`);
      const triggerCodeStr = searchParams.get('bdp_launch_query') || '';
      const triggerCode = JSON.parse(triggerCodeStr).__trigger_id__
      log(`[initFeishuAPI] 获取到triggerCode: ${triggerCode}`);
      return triggerCode
    }
  } else {
    log(`[initFeishuAPI] 非浏览器环境，跳过URL参数和设备检测`);
  }
  return ''
}