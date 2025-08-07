import { useEffect, useState } from 'react';
import { ERROR_MESSAGES } from './constants/algorithms';
import { ProtocolRouter, createDefaultRouter } from './crypto/protocol';
import KeyGenerationSection from './components/KeyGenerationSection';
import ChatSection from './components/ChatSection';
import EncryptionSection from './components/EncryptionSection';
import ProtocolTestSection from './components/ProtocolTestSection';
import MessageDisplay from './components/MessageDisplay';
import { LogDisplay } from './components/LogDisplay';
import { ChatContext } from './constants/types';

// 确保window.crypto可用
if (!window.crypto) {
  throw new Error(ERROR_MESSAGES.CRYPTO_NOT_SUPPORTED);
}



function App() {
  // 状态管理
  const [algorithm, setAlgorithm] = useState('rsa')
  const [publicKey, setPublicKey] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [plaintext, setPlaintext] = useState('')
  const [outgoingMessage, setOutgoingMessage] = useState('')
  const [incomingMessage, setIncomingMessage] = useState('')
  const [sessionId, setSessionId] = useState('')

  const [ciphertext, setCiphertext] = useState('')
  const [symmetricKey, setSymmetricKey] = useState('')
  const [protocolMessage, setProtocolMessage] = useState('')
  const [router] = useState<ProtocolRouter>(createDefaultRouter())
  const [chatContext] = useState<ChatContext>(new ChatContext())



  // 加载Chat上下文
  useEffect(() => {
    
  }, [chatContext]);


  // 模拟加载来信数据
  const loadIncomingMessage = async () => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 模拟返回的数据
    return '这是一条模拟的来信内容，您可以在这里查看收到的消息。';
  };

  // 模拟发送回信数据
  const sendOutgoingMessage = async (message: string) => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 这里只是模拟发送，实际项目中会调用API
    console.log('发送回信:', message);
  };
  // const [openChatId, setOpenChatId] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4 flex flex-col items-center justify-center font-sans text-white">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg border border-white/20">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">加密工具</h1>


        {/* 密钥生成区域 */}
        <KeyGenerationSection
          algorithm={algorithm}
          setAlgorithm={setAlgorithm}
          publicKey={publicKey}
          setPublicKey={setPublicKey}
          privateKey={privateKey}
          setPrivateKey={setPrivateKey}
          symmetricKey={symmetricKey}
          setSymmetricKey={setSymmetricKey}
        />

         {/* 对话区域 */}
        <ChatSection
          chatContext={chatContext}
          sessionId={sessionId}
          setSessionId={setSessionId}
          symmetricKey={symmetricKey}
          setSymmetricKey={setSymmetricKey}
          publicKey={publicKey}
          setPublicKey={setPublicKey}
          outgoingMessage={outgoingMessage}
          setOutgoingMessage={setOutgoingMessage}
          incomingMessage={incomingMessage}
          setIncomingMessage={setIncomingMessage}
          loadIncomingMessage={loadIncomingMessage}
          sendOutgoingMessage={sendOutgoingMessage}
        />

        {/* 加密功能区域 */}
        <EncryptionSection
          publicKey={publicKey}
          privateKey={privateKey}
          plaintext={plaintext}
          setPlaintext={setPlaintext}
          ciphertext={ciphertext}
          setCiphertext={setCiphertext}
          symmetricKey={symmetricKey}
        />

        {/* 协议测试区域 */}
        <ProtocolTestSection
          protocolMessage={protocolMessage}
          setProtocolMessage={setProtocolMessage}
          router={router}
          publicKey={publicKey}
          symmetricKey={symmetricKey}
        />

        {/* 消息显示区域 */}
        <MessageDisplay />

        {/* 日志显示区域 */}
        <LogDisplay />
      </div>
    </div>
  )
}

export default App
