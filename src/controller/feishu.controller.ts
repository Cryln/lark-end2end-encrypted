import { Request } from '@cloudflare/workers-types';
import { FeishuService } from '../service/feishu.service';

/**
 * 处理飞书API相关请求
 */

/**
 * 鉴权中间件
 * 验证请求中的Lark-User-Code头并注入用户标识到上下文
 */
export async function authMiddleware(request: Request, env: Env) {
  // 跳过404路由的鉴权
  if (request.url.includes('/404')) {
    return;
  }

  // log 所有header
  console.log(`[authMiddleware] 所有header: ${JSON.stringify(Object.fromEntries(request.headers))}`);

  // 获取请求头中的Lark-User-Code
  const userCode = request.headers.get('Lark-User-Code');
  // 获取referer
  const referer = request.headers.get('Referer')?.split('?')[0].split('#')[0];

  // 验证用户代码
  if (!userCode) {
    return new Response(JSON.stringify({
      success: false,
      message: '未提供Lark-User-Code'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const userContext = await getUserContext(userCode, env, referer);
  if (userContext && !userContext.authenticated) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户未认证'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 在请求对象上添加自定义属性，用于向下游传递用户标识
  // 注意：Request对象是不可变的，我们通过扩展它的属性来传递信息
  (request as any).userContext = userContext;
  // 验证通过，继续处理请求
  return;
}

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
    // 访问从中间件注入的用户上下文
  const userContext = (request as any).userContext;
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

    // 第二步：获取用户信息
    const userInfo = await feishuService.getUserInfo(userContext.userAccessToken);

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

async function getUserContext(userCode: string, env: Env, redirectUri?: string): Promise<any> {
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


    // 检查code参数
    const code = userCode;
    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少code参数'
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

    // 第一步：获取user_access_token
    const userAccessTokenResponse = await feishuService.getUserAccessToken(code, redirectUri);
    console.log(`[handleGetUserInfoByCode] 获取user_access_token成功: ${JSON.stringify(userAccessTokenResponse)}`);
    const userAccessToken = userAccessTokenResponse.access_token;
    const userContext = {
      userCode,
      userAccessToken,
      authenticated: true
    };
    return userContext;
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