import { useState } from 'react';
import { ERROR_MESSAGES } from './constants/algorithms';
import { ProtocolRouter, createDefaultRouter } from './crypto/protocol';
import KeyGenerationSection from './components/KeyGenerationSection';
import EncryptionSection from './components/EncryptionSection';
import ProtocolTestSection from './components/ProtocolTestSection';
import MessageDisplay from './components/MessageDisplay';
import { LogDisplay } from './components/LogDisplay';

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
  const [ciphertext, setCiphertext] = useState('')
  const [symmetricKey, setSymmetricKey] = useState('')
  const [protocolMessage, setProtocolMessage] = useState('')
  const [router] = useState<ProtocolRouter>(createDefaultRouter())
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

        {/* 加密功能区域 */}
        <EncryptionSection
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
