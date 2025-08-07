import React, { useEffect } from 'react';
import { showToast } from '../api/feishu/showToast';
import { arrayBufferToBase64 } from '../utils/convert';
import CacheService from '../utils/cache';
import { ChatContext, getChatMessage } from '../constants/types';
import { log } from './LogDisplay';
import { getBlockActionSourceDetail } from '../api/feishu';
import { newMessageCard } from '../api/feishu/sendMessageCard';

// // 模拟消息类型定义
// interface Message {
//   id: string;
//   content: string;
//   type: 'incoming' | 'outgoing';
//   timestamp: Date;
// }


interface ChatSectionProps {
  // 从App.tsx传递的状态
  chatContext: ChatContext;
  sessionId: string;
  setSessionId: (sessionId: string) => void;
  symmetricKey: string;
  setSymmetricKey: (symmetricKey: string) => void;
  outgoingMessage: string;
  setOutgoingMessage: (text: string) => void;
  incomingMessage: string;
  setIncomingMessage: (text: string) => void;
  // 模拟加载数据的方法
  loadIncomingMessage: () => Promise<string>;
  sendOutgoingMessage: (message: string) => Promise<void>;
}

/**
 * 对话区组件
 * 显示来信和回信区域，并处理消息发送
 */
const ChatSection: React.FC<ChatSectionProps> = ({
  chatContext,
  sessionId,
  setSessionId,
  symmetricKey,
  setSymmetricKey,
  incomingMessage,
  setIncomingMessage,
  outgoingMessage,
  setOutgoingMessage,
  sendOutgoingMessage,
}) => {
  // 组件初始化时加载来信
  useEffect(() => {
    async function fetchMessages() {
      try {
        const messageDetail = await getBlockActionSourceDetail();
        if (messageDetail && messageDetail.content && messageDetail.content.messages.length > 0) {
          const msg = messageDetail.content.messages[0]
          chatContext.setOpenChatId(msg.openChatId)
          chatContext.setFriendOpenId(msg.sender.open_id)
          chatContext.setTriggerMessage(msg)
        } else {
          showToast('获取消息失败: 消息详情格式错误', 'error');
        }
      } catch (err) {
        showToast('获取消息失败: ' + (err instanceof Error ? err.message : String(err)), 'error');
      }
      showToast('加载来信中...', 'info')
      log(`[ChatSection]触发来信: ${chatContext.triggerMessage}`)
      try {
        // sessionId
        const message = chatContext.triggerMessage
        const chatMessage = getChatMessage(message)
        if (chatMessage) {
          setIncomingMessage(`[${chatMessage.messageType}|${chatMessage.sessionId}] ${chatMessage.content}`)
        }

      } catch (error) {
        showToast('加载来信失败: ' + (error as Error).message, 'error');
      }
    }
    fetchMessages();
  }, [chatContext, setIncomingMessage]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!outgoingMessage.trim()) {
      showToast('请输入回信内容', 'error');
      return;
    }

    try {
      await sendOutgoingMessage(outgoingMessage);
      // 发送成功后清空输入框
      setOutgoingMessage('');
      showToast('回信发送成功', 'success');
    } catch (error) {
      showToast('发送回信失败: ' + (error as Error).message, 'error');
    }
  };

  const startNewSession = async () => {
    // 生成一个UUID
    const newSessionId = crypto.randomUUID();
    const key = genSymmetricKey();
    try {
      if (!chatContext.friendOpenId) {
        throw new Error('未找到好友OpenID')
      }
      await newMessageCard(newSessionId, chatContext.friendOpenId, key)
    } catch (error) {
      showToast('创建新会话失败: ' + (error as Error).message, 'error');
      return
    }
    setSessionId(newSessionId);
    setSymmetricKey(key);
    setIncomingMessage('');
    setOutgoingMessage('');
    showToast('新会话创建成功', 'success');
    CacheService.set(newSessionId, symmetricKey);
  }

  return (
    <div className="space-y-6 p-4 border border-white/20 rounded-lg bg-white/5 mb-6">
      <h2 className="text-xl font-semibold text-center mb-4">对话区</h2>

      <div>
        <textarea
          value={sessionId}
          onChange={() => { }}
          className="w-full p-4 border border-green-300 rounded-md bg-green-900/30 text-white min-h-[100px]"
          placeholder="对话ID"
        ></textarea>
        <button
          onClick={startNewSession}
          disabled={false}
          className={`mt-2 px-4 py-2 rounded-md transition-colors duration-300 ${false ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          新对话
        </button>
      </div>
      {/* 来信区域 */}
      <div>
        <label className="block text-white font-medium mb-2">来信</label>
        <div className="w-full p-4 border border-blue-300 rounded-md bg-blue-900/30 text-white min-h-[100px]">
          {incomingMessage}
        </div>
      </div>

      {/* 回信区域 */}
      <div>
        <label className="block text-white font-medium mb-2">回信</label>
        <textarea
          value={outgoingMessage}
          onChange={(e) => setOutgoingMessage(e.target.value)}
          className="w-full p-4 border border-green-300 rounded-md bg-green-900/30 text-white min-h-[100px]"
          placeholder="请输入回信内容..."
        ></textarea>
        <button
          onClick={handleSendMessage}
          disabled={false}
          className={`mt-2 px-4 py-2 rounded-md transition-colors duration-300 ${false ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {false ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
};

export default ChatSection;


function genSymmetricKey(): string {
  const keyBuffer = new Uint8Array(16);
  window.crypto.getRandomValues(keyBuffer);
  const symmetricKey = arrayBufferToBase64(keyBuffer.buffer);
  return symmetricKey;
}