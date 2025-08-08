/**
 * 飞书API初始化模块
 * 用于在应用启动时初始化飞书相关功能
 */

declare global {
  interface Window {
    h5sdk: any;
    tt: any;
  }
}

// 导入获取消息详情的函数
export { getBlockActionSourceDetail } from './messageDetail';

// 导入发送消息卡片的函数
export { sendMessageCard, sendMessageCardV3 } from './sendMessageCard';

/**
 * 初始化飞书API
 * 暂时仅打印日志，后续可扩展为实际的飞书API初始化逻辑
 */
/**
 * 获取飞书JSAPI签名
 * @param url 当前页面URL
 * @returns 签名参数
 */
async function getJsapiSignature(url: string): Promise<any> {
  try {
    const accessResp = await requestAccess({
      scopeList: [],
    })
    const response = await fetch(`/feishu/jsapi-signature?url=${encodeURIComponent(url)}`, {
      headers: {
        'Lark-User-Code': accessResp.code,
      }
    });
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      console.error(`[getJsapiSignature]获取JSAPI签名失败: ${data.message}`);
      throw new Error(`获取JSAPI签名失败: ${data.message}`);
    }
  } catch (error) {
    console.error(`[getJsapiSignature]获取JSAPI签名异常: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * 注册飞书用户公钥
 * @param openId 飞书用户ID
 * @param pubKey 公钥
 */
export async function register(openId: string, pubKey: string) {
  try {
    const accessResp = await requestAccess({
      scopeList: [],
    })
    const response = await fetch('/kv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lark-User-Code': accessResp.code,
      },
      body: JSON.stringify({
        key: openId,
        value: pubKey,
      }),
    })
    const data = await response.json()
    if (data.success) {
      return data.data
    } else {
      console.error(`[register]注册用户公钥失败: ${data.message}`);
      throw new Error(`注册用户公钥失败: ${data.message}`);
    }
  } catch (error) {
    console.error(`[register]注册用户公钥异常: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * 获取飞书用户公钥
 * @param openId 飞书用户ID
 * @returns 公钥
 */
export async function getPubKey(openId: string): Promise<string | undefined> {
  try {
    const accessResp = await requestAccess({
      scopeList: [],
    })
    const response = await fetch(`/kv?key=${openId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Lark-User-Code': accessResp.code,
      }
    })
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error(`[getPubKey]获取用户公钥异常: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * 通过临时授权码获取用户信息
 * @param code 临时授权码
 * @param redirectUri 重定向URI（可选）
 * @returns 用户信息
 */
import { UserInfoResponse } from '@dto/resp/feishu.resp'
import { requestAccess } from './requestAccess';
export async function getUserInfo(): Promise<UserInfoResponse> {
  try {
    const accessResp = await requestAccess({
          scopeList: [],
        })
    const response = await fetch('/feishu/user-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lark-User-Code': accessResp.code,
      },
      body: JSON.stringify({
        code: accessResp.code,
      }),
    });
    const data = await response.json();
    if (data.success) {
      return data.data as UserInfoResponse;
    } else {
      console.error(`[getUserInfo]获取用户信息失败: ${data.message}`);
      throw new Error(`获取用户信息失败: ${data.message}`);
    }
  } catch (error) {
    console.error(`[getUserInfo]获取用户信息异常: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}


/**
 * 初始化飞书SDK
 * 负责获取JSAPI签名并配置SDK
 * @returns 配置是否成功
 */
export async function initSdk(): Promise<boolean> {
  try {
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined') {
      // 获取当前页面URL用于获取JSAPI签名
      const currentUrl = location.href.split("#")[0];
      console.log(`[initSdk] 当前页面URL: ${currentUrl}`);

      // 获取JSAPI签名
      const signature = await getJsapiSignature(currentUrl);
      console.log(`[initSdk] 获取JSAPI签名成功, sig: ${JSON.stringify(signature)}`);
      // 配置飞书SDK
      return new Promise((resolve, reject) => {
        if (window.h5sdk) {
          window.h5sdk.config({
            appId: signature.appId,
            timestamp: +signature.timestamp,
            nonceStr: signature.nonceStr,
            signature: signature.signature,
            jsApiList: [
              'getBlockActionSourceDetail',
              'sendMessageCard',
              'showToast',
              'requestAccess',
            ],
            onSuccess: (res: any) => {
              console.log(`[initSdk] 飞书SDK配置成功: ${JSON.stringify(res)}`);
              resolve(true);
            },
            onFail: (err: any) => {
              console.error(`[initSdk] 飞书SDK配置失败: ${JSON.stringify(err)}`);
              reject(false);
            },
          });

          window.h5sdk.error((err: any) => {
            console.error(`[initSdk] 飞书SDK错误: ${JSON.stringify(err)}`);
            reject(false);
          });
        } else {
          console.error(`[initSdk] 飞书JSAPI未加载`);
          reject(false);
        }
      });
    }
    return false;
  } catch (error) {
    console.error(`[initSdk] 初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}