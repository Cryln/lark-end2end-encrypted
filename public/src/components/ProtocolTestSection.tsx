import React from 'react';
import { ProtocolMessage, ProtocolRouter } from '../crypto/protocol';
import { showToast } from '../api/feishu/showToast';

interface ProtocolTestSectionProps {
  protocolMessage: string;
  setProtocolMessage: (message: string) => void;
  router: ProtocolRouter;
  publicKey: string;
  symmetricKey: string;
}

/**
 * 应用层协议测试区域组件
 * 包含协议消息输入、读按钮和写按钮
 */
const ProtocolTestSection: React.FC<ProtocolTestSectionProps> = ({
  protocolMessage,
  setProtocolMessage,
  router,
  publicKey,
  symmetricKey,
}) => {
  console.log('symmetricKey', symmetricKey);
  // 协议测试 - 读按钮功能
  const handleReadProtocol = async () => {
    if (!protocolMessage.trim()) {
      await showToast('请输入协议消息JSON', 'info');
      return;
    }

    try {
      const message: ProtocolMessage = JSON.parse(protocolMessage);
      console.log('解析协议消息:', message);
      router.handle(message)
        .then(async () => {
          await showToast('协议消息处理成功', 'success');
        })
        .catch(async (err) => {
          await showToast('协议消息处理失败: ' + err.message, 'error');
        });
    } catch (error) {
      await showToast('JSON解析失败: ' + (error as Error).message, 'error');
    }
  };

  // 协议测试 - 写按钮功能
  const handleWriteProtocol = async () => {
    if (!protocolMessage.trim()) {
      await showToast('请输入要封装的文本', 'info');
      return;
    }

    try {
      // 创建协议消息
      const message: ProtocolMessage = {
        method: 'encrypt',
        pub_key: publicKey || 'placeholder_pub_key',
        data: protocolMessage
      };

      // 转换为JSON字符串并格式化
      const formattedJson = JSON.stringify(message, null, 2);
      setProtocolMessage(formattedJson);
      await showToast('协议消息封装成功', 'success');
    } catch (error) {
      await showToast('协议消息封装失败: ' + (error as Error).message, 'error');
    }
  };

  return (
    <div className="mt-6 bg-white/5 p-3 rounded border border-white/10">
      <h2 className="text-xl font-bold text-center mb-4 text-white">应用层协议测试</h2>
      <div className="mb-3">
        <label htmlFor="protocolMessage" className="block text-white font-medium mb-2">协议消息 (JSON)</label>
        <textarea
          id="protocolMessage"
          value={protocolMessage}
          onChange={(e) => setProtocolMessage(e.target.value)}
          className="w-full px-3 py-3 border border-white/20 rounded-md bg-white/10 text-white min-h-[150px]"
          placeholder="请输入JSON格式的协议消息..."
        ></textarea>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleReadProtocol}
          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors duration-300"
        >
          读 (B)
        </button>
        <button
          onClick={handleWriteProtocol}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-300"
        >
          写 (C)
        </button>
      </div>
    </div>
  );
};

export default ProtocolTestSection;