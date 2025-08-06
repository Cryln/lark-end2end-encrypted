import { IRequest } from 'itty-router';
import { MyData } from '../dto/req/kv';
import { ConfigService } from '../service/config.service';

/**
 * 处理配置创建请求
 */
export async function handlePostConfig(request: IRequest, env: Env) {
  try {
    const data = await request.json<MyData>();
    if (!data.key || !data.value) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // 添加超时控制防止KV操作挂起
    const configService = new ConfigService(env.TODO_CONFIG);
    await configService.setConfig(data);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Config POST error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 处理配置获取请求
 */
export async function handleGetConfig(request: IRequest, env: Env) {
  try {
    const key = new URL(request.url).searchParams.get('key');
    if (!key) {
      return new Response(JSON.stringify({ success: false, message: 'key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // 添加超时控制防止KV操作挂起
    const configService = new ConfigService(env.TODO_CONFIG);
    const value = await configService.getConfig(key);
    return new Response(JSON.stringify({ success: true, data: value }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Config GET error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}