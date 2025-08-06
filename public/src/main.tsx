import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
// 导入飞书SDK初始化函数
import { initSdk } from './api/feishu/index'

// 初始化飞书SDK
await initSdk();
// 渲染应用
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
