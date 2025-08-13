# 飞书端到端加密应用 (lark-end2end-encrypted)

这个项目实现了一个运行在Cloudflare Worker上的飞书应用服务端，提供端到端加密通信功能及相关服务支持。

## 核心功能

1. 提供JSAPI签名接口，用于前端调用飞书JSAPI
2. 端到端加密通信支持，包括密钥生成、加密传输和解密功能
3. 安全会话管理，确保通信双方身份验证和会话安全

## 项目结构

```
├── .editorconfig
├── .gitignore
├── .prettierrc
├── .vscode/
│   └── settings.json
├── README.md
├── package-lock.json
├── package.json
├── public/
│   ├── .gitignore
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ChatSection.tsx
│   │   │   ├── KeyGenerationSection.tsx
│   │   │   └── LogDisplay.tsx
│   │   ├── constants/
│   │   ├── crypto/
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── utils/
│   │   └── vite-env.d.ts
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── src/
│   ├── controller/
│   │   ├── config.controller.ts
│   │   └── feishu.controller.ts   # 飞书API控制器
│   ├── dto/
│   │   ├── req/
│   │   └── resp/
│   ├── service/
│   │   ├── config.service.ts
│   │   ├── kv.ts
│   │   └── feishu.service.ts      # 飞书API服务
│   ├── routes/
│   │   └── index.ts              # 路由配置
│   └── index.ts                  # Worker入口
├── test/
│   ├── env.d.ts
│   ├── index.spec.ts
│   └── tsconfig.json
├── tsconfig.json
├── vitest.config.mts
├── worker-configuration.d.ts     # 环境变量类型定义
└── wrangler.jsonc                # Cloudflare Worker配置
```

## 功能实现

### 1. JSAPI签名接口

- 提供`/feishu/jsapi-signature`接口，接收当前网页URL作为参数
- 生成飞书JSAPI所需的签名参数（appId、timestamp、nonceStr、signature）

### 2. 端到端加密通信流程

系统实现了自动化的密钥管理和加密通信流程，具体如下：

1. **自动注册与密钥生成**：用户初次进入应用时，系统会自动生成RSA密钥对并存储在本地。同时，公钥会与用户的open_id关联后上传至Cloudflare KV存储，简化后续公钥交换流程。

2. **安全会话建立**：当用户向已注册的联系人，通过消息快捷操作，进入应用时，系统会自动获取对方的公钥。开启新会话时，系统生成随机AES会话密钥，使用对方公钥加密后，将“新会话”以加密卡片形式发送给对方。

3. **会话密钥管理**：接收方通过消息快捷操作处理“新会话”卡片，解密获取并本地缓存AES会话密钥。之后同一会话的后续消息均使用此AES密钥进行加密通信，确保通信安全高效。

### 4. 端到端加密功能

- 前端实现了密钥生成功能，支持多种加密算法
- 通信内容通过公钥加密、私钥解密的方式确保安全
- 会话密钥管理，确保每次会话使用独立密钥

### 5. 安全会话管理

- 基于飞书用户身份认证的会话建立
- 会话ID和密钥的安全存储和传输
- 会话过期机制，增强安全性

## 部署说明

### 1. 安装依赖

```bash
npm install
```
> 注：根目录的`preinstall`脚本会自动安装前端依赖。

### 2. 设置环境变量

使用wrangler命令设置飞书应用的ID和密钥：

```bash
wrangler secret put FEISHU_APP_ID
wrangler secret put FEISHU_APP_SECRET
```

### 3. 构建项目

如果需要提前构建前端资源而不立即部署，可以执行：

```bash
npm run build
```
> 该命令会依次执行前端构建（`fe-build`），使用wrangler deploy时无需单独构建后端。

### 4. 部署Worker

```bash
npm run deploy
```
> 该命令会直接调用`wrangler deploy`部署Worker。

### 5. 本地开发

```bash
# 启动Worker本地开发服务器
npm run dev

# 启动前端开发服务器
cd public
npm run dev
```

## API接口文档

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

## 前端使用说明

1. 生成密钥对: 在前端界面选择加密算法，点击生成密钥
2. 分享公钥: 将生成的公钥分享给通信对方
3. 建立会话: 输入会话ID和对称密钥，开始加密通信
4. 发送消息: 输入消息内容，系统自动加密并发送
5. 接收消息: 接收并自动解密对方发送的加密消息

## 注意事项

1. 确保在飞书开放平台正确配置了应用的回调URL和权限
2. 敏感信息如appId和appSecret通过环境变量传递，不会硬编码在代码中
3. 密钥保管: 私钥仅存储在本地，请勿泄露给他人
4. 会话安全: 建议定期更换会话密钥，增强通信安全性