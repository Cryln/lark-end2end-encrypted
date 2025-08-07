/**
 * 飞书请求访问权限API模块
 * 提供增量授予应用访问权限的功能
 * 文档地址: https://open.larkoffice.com/document/web-app/gadget-api/open-ability/login/requestaccess
 */

// 导入日志工具
import { log, logError } from '../../components/LogDisplay';
import { getAppId } from '../../utils/common';

/**
 * requestAccess请求参数接口
 */
interface RequestAccessParams {
  /** 授予应用权限列表，空数组表示仅授予应用获取用户凭证信息权限 */
  scopeList: string[];
  /** 用来维护请求和回调状态的附加字符串 */
  state?: string;
}

/**
 * requestAccess成功返回结果接口
 */
interface RequestAccessSuccessResult {
  /** 临时登录凭证，有效期3分钟，只能使用一次 */
  code: string;
  /** 用来维护请求和回调状态的附加字符串 */
  state?: string;
}

/**
 * 请求访问权限
 * @param params 请求参数
 * @returns 包含临时登录凭证的Promise
 */
export function requestAccess(params: RequestAccessParams): Promise<RequestAccessSuccessResult> {
  return new Promise((resolve, reject) => {
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined') {
      const appId = getAppId();
      // 检查飞书JSAPI是否加载
      if (window.h5sdk) {
        window.h5sdk.ready(() => {
          log(`[requestAccess] 开始请求访问权限: ${JSON.stringify(params)}`);

          // 调用飞书JSAPI请求访问权限
          window.tt.requestAccess({
            scopeList: params.scopeList,
            state: params.state,
            appID: appId,
            success(res: any) {
              log(`[requestAccess] 请求访问权限成功: ${JSON.stringify(res)}`);
              resolve({
                code: res.code,
                state: res.state
              });
            },
            fail(res: any) {
              logError(`[requestAccess] 请求访问权限失败: ${JSON.stringify(res)}`);
              reject(new Error(`[requestAccess] 请求访问权限失败: ${res.errMsg || JSON.stringify(res)}`));
            }
          });
        });
      } else {
        const errorMsg = '飞书JSAPI未加载';
        console.error(errorMsg);
        logError(`[requestAccess] ${errorMsg}`);
        reject(new Error(errorMsg));
      }
    } else {
      const errorMsg = '非浏览器环境，无法请求访问权限';
      console.error(errorMsg);
      logError(`[requestAccess] ${errorMsg}`);
      reject(new Error(errorMsg));
    }
  });
}