import { Router } from 'itty-router';
import { handlePostConfig, handleGetConfig } from '../controller/config.controller';
import { handleGetJsapiSignature, handleGetUserInfoByCode ,authMiddleware } from '../controller/feishu.controller';

// 创建路由实例
const router = Router();



/**
 * 配置路由
 * 集中管理所有API端点定义
 */
router
  // 应用鉴权中间件到所有路由
  .all('*', authMiddleware)
  // 配置管理路由
  .post('/kv', handlePostConfig)
  .get('/kv', handleGetConfig)

  // 飞书API路由
  .get('/feishu/jsapi-signature', handleGetJsapiSignature)
  .post('/feishu/user-info', handleGetUserInfoByCode)

  // 404路由
  .all('*', () => new Response(JSON.stringify({
    success: false,
    message: 'Route not found'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  }));

export default router;