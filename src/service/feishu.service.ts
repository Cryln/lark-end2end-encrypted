import { Crypto } from '@cloudflare/workers-types';
import * as lark from '@larksuiteoapi/node-sdk';
import { TenantAccessTokenResponse, JsapiTicketResponse, UserAccessTokenResponse, UserInfoResponse } from '../dto/resp/feishu.resp';

declare const crypto: Crypto;

/**
 * 飞书API服务
 * 处理飞书应用的鉴权和JSAPI票据管理
 */
export class FeishuService {
  private readonly kvNamespace: KVNamespace;
  private readonly timeoutMs: number = 5000;
  private readonly feishuHost: string = 'https://open.feishu.cn';
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(kvNamespace: KVNamespace, appId: string, appSecret: string) {
    this.kvNamespace = kvNamespace;
    this.appId = appId;
    this.appSecret = appSecret;
  }

  /**
   * 获取tenant_access_token
   * 参考文档: https://open.larkoffice.com/document/server-docs/authentication-management/access-token/tenant_access_token_internal
   */
  async getTenantAccessToken(): Promise<string> {
    // 首先尝试从KV获取缓存的access_token和过期时间
    const cachedToken = await this.kvNamespace.get('feishu_tenant_access_token');
    const expireTimeStr = await this.kvNamespace.get('feishu_tenant_access_token_expire');

    if (cachedToken && expireTimeStr) {
      const expireTime = parseInt(expireTimeStr, 10);
      const now = Date.now();

      // 如果token有效期大于30分钟，则直接返回缓存的token
      if (expireTime - now > 30 * 60 * 1000) {
        return cachedToken;
      }
    }

    // 否则，重新获取token
    const url = `${this.feishuHost}/open-apis/auth/v3/tenant_access_token/internal`;
    const requestBody = {
      app_id: this.appId,
      app_secret: this.appSecret
    };

    const response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(requestBody)
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('获取tenant_access_token超时')), this.timeoutMs)
      )
    ]);

    if (!response.ok) {
      throw new Error(`获取tenant_access_token失败: ${response.status} ${response.statusText}`);
    }

    const data: TenantAccessTokenResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`获取tenant_access_token失败: ${data.msg}`);
    }

    // 缓存token和过期时间
    const tenantAccessToken = data.tenant_access_token;
    const expireTime = Date.now() + data.expire * 1000;
    console.log(`[getTenantAccessToken] 缓存tenant_access_token: ${tenantAccessToken}, 过期时间: ${expireTime}`);

    await Promise.all([
      this.kvNamespace.put('feishu_tenant_access_token', tenantAccessToken),
      this.kvNamespace.put('feishu_tenant_access_token_expire', expireTime.toString())
    ]);

    return tenantAccessToken;
  }

  /**
   * 获取jsapi_ticket
   * 参考文档: https://open.larkoffice.com/document/authentication-management/access-token/authorization
   */
  async getJsapiTicket(): Promise<string> {
    // 首先尝试从KV获取缓存的ticket和过期时间
    const cachedTicket = await this.kvNamespace.get('feishu_jsapi_ticket');
    const expireTimeStr = await this.kvNamespace.get('feishu_jsapi_ticket_expire');

    if (cachedTicket && expireTimeStr) {
      const expireTime = parseInt(expireTimeStr, 10);
      const now = Date.now();

      // 如果ticket有效期大于30分钟，则直接返回缓存的ticket
      if (expireTime - now > 30 * 60 * 1000) {
        return cachedTicket;
      }
    }

    // 获取tenant_access_token
    const tenantAccessToken = await this.getTenantAccessToken();

    // 使用tenant_access_token获取jsapi_ticket
    const url = `${this.feishuHost}/open-apis/jssdk/ticket/get`;

    const response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tenantAccessToken}`,
          'Content-Type': 'application/json; charset=utf-8'
        }
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('获取jsapi_ticket超时')), this.timeoutMs)
      )
    ]);

    if (!response.ok) {
      throw new Error(`获取jsapi_ticket失败: ${response.status} ${response.statusText}`);
    }

    const data: JsapiTicketResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`获取jsapi_ticket失败: ${data.msg}`);
    }

    // 缓存ticket和过期时间
    const jsapiTicket = data.data.ticket;
    const expireTime = Date.now() + data.data.expire_in * 1000;

    await Promise.all([
      this.kvNamespace.put('feishu_jsapi_ticket', jsapiTicket),
      this.kvNamespace.put('feishu_jsapi_ticket_expire', expireTime.toString())
    ]);

    return jsapiTicket;
  }

  /**
   * 生成JSAPI签名
   * @param url 当前网页URL
   * @returns 签名参数
   */
  async generateJsapiSignature(url: string): Promise<{
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
  }> {
    const jsapiTicket = await this.getJsapiTicket();
    const timestamp = Math.floor(Date.now());
    const nonceStr = this.generateNonceStr();

    // 按照飞书要求的格式拼接字符串
    const signatureStr = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    console.log(`[generateJsapiSignature] 签名字符串: ${signatureStr}`);

    // 使用SHA1算法生成签名
    // 注意：在Cloudflare Worker中，需要使用Web Crypto API实现SHA1
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureStr);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      appId: this.appId,
      timestamp,
      nonceStr,
      signature
    };
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(length: number = 16): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let nonceStr = '';
    for (let i = 0; i < length; i++) {
      nonceStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonceStr;
  }

  /**
   * 获取user_access_token
   * 参考文档: https://open.larkoffice.com/document/authentication-management/access-token/get-user-access-token
   * @param code 临时授权码
   * @param redirectUri 重定向URI（网页应用必填）
   * @returns user_access_token信息
   */
  async getUserAccessToken(code: string, redirectUri?: string): Promise<UserAccessTokenResponse> {
    const url = `${this.feishuHost}/open-apis/authen/v2/oauth/token`;
    const requestBody: any = {
      grant_type: 'authorization_code',
      client_id: this.appId,
      client_secret: this.appSecret,
      code: code
    };

    if (redirectUri) {
      requestBody.redirect_uri = redirectUri;
    }

    const response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(requestBody)
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('获取user_access_token超时')), this.timeoutMs)
      )
    ]);

    if (!response.ok) {
      throw new Error(`获取user_access_token失败: ${response.status} ${response.statusText}`);
    }

    const data: UserAccessTokenResponse = await response.json();
    if (data.code !== 0) {
      throw new Error(`获取user_access_token失败: ${data.error_description}`);
    }

    return data;
  }

  /**
   * 获取用户信息
   * 参考文档: https://open.larkoffice.com/document/server-docs/authentication-management/login-state-management/get
   * @param userAccessToken 用户访问令牌
   * @returns 用户信息
   */
  async getUserInfo(userAccessToken: string): Promise<UserInfoResponse> {
    // 开发者复制该Demo后，需要修改Demo里面的"app id", "app secret"为自己应用的appId, appSecret
    const client = new lark.Client({
      appId: this.appId,
      appSecret: this.appSecret,
      // disableTokenCache为true时，SDK不会主动拉取并缓存token，这时需要在发起请求时，调用lark.withTenantToken("token")手动传递
      // disableTokenCache为false时，SDK会自动管理租户token的获取与刷新，无需使用lark.withTenantToken("token")手动传递token
      disableTokenCache: true
    });

    try {
      // 调用API获取用户信息
      const res = await client.authen.v1.userInfo.get(
        {},
        lark.withTenantToken(userAccessToken)
      );

      console.log('[getUserInfoV2] 获取用户信息响应:', res);

      // 检查响应状态
      if (res.code !== 0 || !res.data) {
        throw new Error(`获取用户信息失败: ${res.msg || '未知错误'}`);
      }

      // 类型转换并返回用户信息
      return res as UserInfoResponse;
    } catch (e) {
      console.error('[getUserInfoV2] 获取用户信息失败:', e);
      const errorMessage = e instanceof Error ? e.message : '获取用户信息失败';
      throw new Error(errorMessage);
    }
  }
}