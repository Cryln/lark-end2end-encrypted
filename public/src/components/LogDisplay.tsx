import React, { useState, useEffect } from 'react';

// 全局日志存储
let logs: string[] = [];
let subscribers: ((logs: string[]) => void)[] = [];

/**
 * 记录普通日志
 * @param message 日志消息
 */
export function log(message: string) {
  console.log(message);
  addLog(message);
}

/**
 * 记录错误日志
 * @param message 错误消息
 */
export function logError(message: string) {
  console.error(message);
  addLog(`[错误] ${message}`);
}

// 导出添加日志的函数
export function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  logs = [...logs, `[${timestamp}] ${message}`];
  // 通知所有订阅者
  subscribers.forEach(subscriber => subscriber(logs));
}

// 日志展示组件
export const LogDisplay: React.FC = () => {
  const [localLogs, setLocalLogs] = useState<string[]>(logs);

  useEffect(() => {
    // 订阅日志更新
    subscribers.push(setLocalLogs);
    // 清理函数
    return () => {
      subscribers = subscribers.filter(sub => sub !== setLocalLogs);
    };
  }, []);

  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">飞书API日志</h3>
      <textarea
        className="w-full h-64 p-2 border border-gray-300 rounded-md bg-black font-mono text-sm"
        value={localLogs.join('\n')}
        readOnly
      />
    </div>
  );
};

export default LogDisplay;