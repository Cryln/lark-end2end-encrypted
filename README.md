# 飞书端到端加密应用 (lark-end2end-encrypted)

这个项目实现了一个运行在Cloudflare Worker上的飞书应用服务端，提供以下功能：

1. 定时刷新飞书应用的tenant_access_token
2. 提供JSAPI签名接口，用于前端调用飞书JSAPI

## 项目结构

```
├── src/
│   ├── controller/
│   │   ├── config.controller.ts
│   │   └── feishu.controller.ts   # 飞书API控制器
│   ├── service/
│   │   ├── config.service.ts
│   │   ├── kv.ts
│   │   └── feishu.service.ts      # 飞书API服务
│   ├── routes/
│   │   └── index.ts              # 路由配置
│   └── index.ts                  # Worker入口
├── wrangler.jsonc                # Cloudflare Worker配置
├── worker-configuration.d.ts     # 环境变量类型定义
└── package.json                  # 项目依赖
```

## 功能实现

### 1. 定时刷新access_token

- 通过Cloudflare Worker的定时触发器，每小时调用`/feishu/refresh-token`接口刷新token
- token存储在Cloudflare KV中，并实现了缓存机制，避免频繁调用飞书API

### 2. JSAPI签名接口

- 提供`/feishu/jsapi-signature`接口，接收当前网页URL作为参数
- 生成飞书JSAPI所需的签名参数（appId、timestamp、nonceStr、signature）

## 部署说明

### 1. 安装依赖

```bash
npm install
```

### 2. 设置环境变量

使用wrangler命令设置飞书应用的ID和密钥：

```bash
wrangler secret put FEISHU_APP_ID
wrangler secret put FEISHU_APP_SECRET
```

### 3. 部署Worker

```bash
npm run deploy
```

## API接口文档

### 刷新access_token

- 路径: `/feishu/refresh-token`
- 方法: `POST`
- 描述: 刷新飞书应用的tenant_access_token
- 响应示例:
  ```json
  {
    "success": true,
    "message": "Access token刷新成功"
  }
  ```

### 获取JSAPI签名

- 路径: `/feishu/jsapi-signature`
- 方法: `GET`
- 参数:
  - `url`: 当前网页的URL
- 响应示例:
  ```json
  {
    "success": true,
    "data": {
      "appId": "your_app_id",
      "timestamp": 1623456789,
      "nonceStr": "random_string",
      "signature": "generated_signature"
    }
  }
  ```

## 注意事项

1. 确保在飞书开放平台正确配置了应用的回调URL和权限
2. access_token和jsapi_ticket都有有效期限制，服务端实现了自动刷新机制
3. 定时触发器配置为每小时执行一次，确保token不会过期
4. 敏感信息如appId和appSecret通过环境变量传递，不会硬编码在代码中