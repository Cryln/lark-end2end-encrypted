import { useEffect, useState } from 'react';
import { ERROR_MESSAGES } from './constants/algorithms';
import KeyGenerationSection from './components/KeyGenerationSection';
import ChatSection from './components/ChatSection';
import EncryptionSection from './components/EncryptionSection';
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

  const [ciphertext, setCiphertext] = useState('')
  const [symmetricKey, setSymmetricKey] = useState('')
  const [chatContext] = useState<ChatContext>(new ChatContext())



  // 加载Chat上下文
  useEffect(() => {
    
  }, [chatContext]);

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
          publicKey={publicKey}
          privateKey={privateKey}
          outgoingMessage={outgoingMessage}
          setOutgoingMessage={setOutgoingMessage}
          incomingMessage={incomingMessage}
          setIncomingMessage={setIncomingMessage}
        />

        <div className="debug border-2 border-red-500 p-4 mb-4">
          <label className="block text-white font-medium mb-2">debug on</label>
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

          {/* 消息显示区域 */}
          <MessageDisplay />

          {/* 日志显示区域 */}
          <LogDisplay />
        </div>
      </div>
    </div>
  )
}

export default App
