import { Request } from '@cloudflare/workers-types';
import { FeishuService } from '../service/feishu.service';

/**
 * 处理飞书API相关请求
 */

/**
 * 刷新tenant_access_token
 * 此接口应被定时触发器调用
 */
export async function handleRefreshFeishuToken(request: Request, env: Env) {
  try {
    // 检查是否提供了必要的环境变量
    if (!env.FEISHU_APP_ID || !env.FEISHU_APP_SECRET) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少飞书应用ID或密钥'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const feishuService = new FeishuService(
      env.TODO_CONFIG,
      env.FEISHU_APP_ID,
      env.FEISHU_APP_SECRET
    );

    // 强制刷新token
    await feishuService.getTenantAccessToken();

    return new Response(JSON.stringify({
      success: true,
      message: 'Access token刷新成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error('刷新飞书token失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return new Response(JSON.stringify({
      success: false,
      message: `刷新飞书token失败: ${errorMessage}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 获取JSAPI签名参数
 * 供前端调用JSAPI时使用
 */
export async function handleGetJsapiSignature(request: Request, env: Env) {
  try {
    // 检查是否提供了必要的环境变量
    if (!env.FEISHU_APP_ID || !env.FEISHU_APP_SECRET) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少飞书应用ID或密钥'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取请求参数
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少url参数'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const feishuService = new FeishuService(
      env.TODO_CONFIG,
      env.FEISHU_APP_ID,
      env.FEISHU_APP_SECRET
    );

    // 生成JSAPI签名
    const signatureParams = await feishuService.generateJsapiSignature(url);
    console.log(`[handleGetJsapiSignature] 生成的JSAPI签名参数: ${JSON.stringify(signatureParams)}`);
    return new Response(JSON.stringify({
      success: true,
      data: signatureParams
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error('获取JSAPI签名失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return new Response(JSON.stringify({
      success: false,
      message: `获取JSAPI签名失败: ${errorMessage}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
   * 通过临时授权码获取用户信息
   * @param request 请求对象
   * @param env 环境变量
   * @returns 用户信息响应
   */
export async function handleGetUserInfoByCode(request: Request, env: Env) {
  // 定义请求体接口
  interface GetUserInfoByCodeRequest {
    code: string;
    redirectUri?: string;
  }
  try {
    // 检查是否提供了必要的环境变量
    if (!env.FEISHU_APP_ID || !env.FEISHU_APP_SECRET) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少飞书应用ID或密钥'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 解析请求体
    let requestBody: GetUserInfoByCodeRequest;
    try {
      requestBody = await request.json() as GetUserInfoByCodeRequest;
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: '请求体格式无效'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查code参数
    const code = requestBody.code;
    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少code参数'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取redirectUri（可选）
    const redirectUri = requestBody.redirectUri;

    const feishuService = new FeishuService(
      env.TODO_CONFIG,
      env.FEISHU_APP_ID,
      env.FEISHU_APP_SECRET
    );

    // 第一步：获取user_access_token
    const userAccessTokenResponse = await feishuService.getUserAccessToken(code, redirectUri);
    const userAccessToken = userAccessTokenResponse.access_token;

    // 第二步：获取用户信息
    const userInfo = await feishuService.getUserInfo(userAccessToken);

    console.log(`[handleGetUserInfoByCode] 获取用户信息成功: ${JSON.stringify(userInfo)}`);
    return new Response(JSON.stringify({
      success: true,
      data: userInfo
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error('通过临时授权码获取用户信息失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return new Response(JSON.stringify({
      success: false,
      message: `通过临时授权码获取用户信息失败: ${errorMessage}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}