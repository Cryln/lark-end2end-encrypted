import React, { useEffect } from 'react';
import { showToast } from '../api/feishu/showToast';
import { ChatContext, ChatMessage, getChatMessage } from '../constants/types';
import { log } from './LogDisplay';
import { getBlockActionSourceDetail, getPubKey, getUserInfo, register } from '../api/feishu';
import { newMessageCard, replyMessageCard } from '../api/feishu/sendMessageCard';
import { decrypt, decryptAES, encryptAES, genSymmetricKey } from '../crypto/keyGeneration';
import CacheService from '../utils/cache';

interface ChatSectionProps {
  // 从App.tsx传递的状态
  chatContext: ChatContext;
  publicKey: string;
  privateKey: string;
  outgoingMessage: string;
  setOutgoingMessage: (text: string) => void;
  incomingMessage: string;
  setIncomingMessage: (text: string) => void;
}

/**
 * 对话区组件
 * 显示来信和回信区域，并处理消息发送
 */
const ChatSection: React.FC<ChatSectionProps> = ({
  chatContext,
  publicKey,
  privateKey,
  incomingMessage,
  setIncomingMessage,
  outgoingMessage,
  setOutgoingMessage,
}) => {

  const setSymmetricKeyWrapper = (key: string) => {
    log(`[ChatSection]setSymmetricKeyWrapper: ${key}`)
    if (!key) {
      return
    }
    chatContext.setSymmetricKey(key)
    CacheService.set(chatContext.sessionId!, key)
  }

  const setMessageCard = async (chatMsg: ChatMessage) => {
    log(`[ChatSection]setMessageCard: ${JSON.stringify(chatMsg)}`)
    const title = `${chatMsg.messageType}#${chatMsg.sessionId}`
    let content = chatMsg.content
    if (chatMsg.messageType === '新会话') {
      content = await decrypt(content, privateKey, 'rsa')
      setSymmetricKeyWrapper(content)
      content = "会话密钥：" + content
    } else if (chatMsg.messageType === '回信') {
      content = await decryptAES(content, chatContext.symmetricKey!)
    }
    setIncomingMessage(title + '\n' + content)
  }

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!outgoingMessage) {
      showToast('请输入回信内容', 'error');
      return;
    }

    try {
      const encrypted = await encryptAES(outgoingMessage, chatContext.symmetricKey!)
      await replyMessageCard(chatContext.sessionId!, encrypted);
      // 发送成功后清空输入框
      setOutgoingMessage('');
      showToast('回信发送成功', 'success');
    } catch (error) {
      showToast('发送回信失败: ' + (error as Error).message, 'error');
    }
  };

  const startNewSession = async () => {
    // 生成一个UUID
    const newsessionId = crypto.randomUUID();
    const key = genSymmetricKey();
    try {
      if (!chatContext.friendOpenId) {
        throw new Error('未找到好友OpenID')
      }
      await newMessageCard(newsessionId, chatContext.friendOpenId, key)
    } catch (error) {
      showToast('创建新会话失败: ' + (error as Error).message, 'error');
      return
    }
    chatContext.setSessionId(newsessionId)
    setSymmetricKeyWrapper(key);
    setIncomingMessage('');
    setOutgoingMessage('');
    showToast('新会话创建成功', 'success');
  }

  // 组件初始化时加载来信
  useEffect(() => {
    async function fetchMessages() {
      try {
        // 查询用户信息
        const userInfo = await getUserInfo()
        log(`[ChatSection]获取用户信息: ${JSON.stringify(userInfo)}`)
        if (!userInfo.data || !userInfo.data.open_id) {
          throw new Error('获取用户信息失败')
        }
        chatContext.setMyOpenId(userInfo.data.open_id)

        const messageDetail = await getBlockActionSourceDetail();
        if (messageDetail && messageDetail.content && messageDetail.content.messages.length > 0) {
          const msg = messageDetail.content.messages[0]
          chatContext.setOpenChatId(msg.openChatId)
          chatContext.setFriendOpenId(msg.sender.open_id)
          chatContext.setTriggerMessage(msg)
        } else {
          throw new Error('获取消息失败: 消息详情格式错误')
        }

        // 查询用户公钥
        const pubKey = await getPubKey(userInfo.data.open_id)
        log(`[ChatSection]获取用户公钥: ${pubKey}`)
        log(`[ChatSection]pubKey: ${pubKey}, publicKey: ${publicKey}`)
        if ((!pubKey || pubKey != publicKey) && publicKey != '') {
          await register(chatContext.myOpenId!, publicKey)
        }

      } catch (err) {
        showToast('获取消息失败: ' + (err instanceof Error ? err.message : String(err)), 'error');
      }
      log(`[ChatSection]触发来信: ${chatContext.triggerMessage}`)
      try {
        // chatContext.sessionId!
        const message = chatContext.triggerMessage
        const chatMessage = getChatMessage(message)
        if (chatMessage) {
          chatContext.setSessionId(chatMessage.sessionId)
          const key = CacheService.get<string>(chatMessage.sessionId)
          log(`[ChatSection]获取会话密钥: ${key}`)
          if (key) {
            setSymmetricKeyWrapper(key)
          }
          setMessageCard(chatMessage)
        }

      } catch (error) {
        showToast('加载来信失败: ' + (error as Error).message, 'error');
      }
    }
    fetchMessages();
  }, [chatContext, setIncomingMessage, publicKey]);


  return (
    <div className="space-y-6 p-4 border border-white/20 rounded-lg bg-white/5 mb-6">
      <h2 className="text-xl font-semibold text-center mb-4">对话区</h2>

      <div>
        <textarea
          className="w-full p-4 border border-blue-300 rounded-md bg-blue-900/30 text-white min-h-[100px]"
          readOnly
          value={`会话ID：${chatContext.sessionId!}\n密钥：${chatContext.symmetricKey || 'null'}`}
          placeholder="会话ID:密钥"
          rows={2}
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
        <textarea
          className="w-full p-4 border border-blue-300 rounded-md bg-blue-900/30 text-white min-h-[100px]"
          readOnly
          value={incomingMessage}
          placeholder="来信"
          rows={2}
        ></textarea>
      </div>

      {/* 回信区域 */}
      <div>
        <label className="block text-white font-medium mb-2">回信</label>
        <textarea
          value={outgoingMessage}
          onChange={(e) => setOutgoingMessage(e.target.value)}
          disabled={!chatContext.friendOpenId || !chatContext.sessionId!}
          className="w-full p-4 border border-green-300 rounded-md bg-green-900/30 text-white min-h-[100px]"
          placeholder={!chatContext.friendOpenId || !chatContext.sessionId! ? '请选择好友消息回复' : '请输入回信内容...'}
        ></textarea>
        <button
          onClick={handleSendMessage}
          disabled={!chatContext.symmetricKey}
          className={`mt-2 px-4 py-2 rounded-md transition-colors duration-300 ${false ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {false ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
};

export default ChatSection;
