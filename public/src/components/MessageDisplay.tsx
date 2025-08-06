import React, { useState, useEffect } from 'react';
import { getBlockActionSourceDetail } from '../api/feishu';

interface Message {
  openMessageId: string;
  support: boolean;
  content: string;
  createTime: number;
  openChatId: string;
  messageType: string;
  status: boolean;
  sender: {
    open_id: string;
    name: string;
  };
}

const MessageDisplay: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        const messageDetail = await getBlockActionSourceDetail();
        if (messageDetail && messageDetail.content && messageDetail.content.messages) {
          setMessages(messageDetail.content.messages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        setError('获取消息失败: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">加载消息中...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (messages.length === 0) {
    return <div className="p-4 text-center">没有获取到消息</div>;
  }

  return (
    <div className="p-4 bg-black rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">获取的消息</h2>
      {messages.map((msg, index) => (
        <div key={index} className="mb-4 p-3 border-b border-gray-200">
          <div className="flex items-center mb-2">
            <span className="font-medium">{msg.sender.name}</span>
            <span className="ml-auto text-sm text-gray-500">
              {new Date(msg.createTime).toLocaleString()}
            </span>
          </div>
          {msg.support ? (
            <div className="bg-gray-50 p-2 rounded">
              {typeof msg.content === 'string' ? (
                <p>{msg.content}</p>
              ) : (
                <pre className="text-sm overflow-x-auto">{JSON.stringify(msg.content, null, 2)}</pre>
              )}
            </div>
          ) : (
            <div className="text-gray-500 italic">不支持的消息类型</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageDisplay;