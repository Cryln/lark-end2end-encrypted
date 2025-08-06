import React, { useEffect } from 'react';
import AlgorithmSelector from './AlgorithmSelector';
import KeyDisplay from './KeyDisplay';
import Cache from '../utils/cache';
import { generateKeyPair } from '../crypto/keyGeneration';
import { arrayBufferToBase64 } from '../utils/convert';

interface KeyGenerationSectionProps {
  algorithm: string;
  setAlgorithm: (algorithm: string) => void;
  publicKey: string;
  setPublicKey: (publicKey: string) => void;
  privateKey: string;
  setPrivateKey: (privateKey: string) => void;
  symmetricKey: string;
  setSymmetricKey: (symmetricKey: string) => void;
}

/**
 * 密钥生成区域组件
 * 包含算法选择、密钥显示和生成功能
 */
const KeyGenerationSection: React.FC<KeyGenerationSectionProps> = ({
  algorithm,
  setAlgorithm,
  publicKey,
  setPublicKey,
  privateKey,
  setPrivateKey,
  symmetricKey,
  setSymmetricKey,
}) => {
  const negotiateKey = async () => {
    try {
      // 生成16字节的随机密钥 (AES-128)
      const keyBuffer = new Uint8Array(16);
      window.crypto.getRandomValues(keyBuffer);
      const symmetricKey = arrayBufferToBase64(keyBuffer.buffer);
      setSymmetricKey(symmetricKey);
    } catch (error) {
      console.error('密钥协商失败:', error);
      alert('密钥协商失败: ' + (error as Error).message);
    }
  }

// 生成密钥对
  const generateKeys = async () => {
    try {
      setPublicKey('生成中...');
      setPrivateKey('生成中...');
      const { publicKey, privateKey } = await generateKeyPair(algorithm);
      setPublicKey(publicKey);
      setPrivateKey(privateKey);
      Cache.set("jmj_pub_key", publicKey);
      Cache.set("jmj_pri_key", privateKey);
    } catch (error) {
      console.error('生成密钥失败:', error);
      alert((error as Error).message);
      setPublicKey('');
      setPrivateKey('');
    }
  }

  useEffect(() => {
    const pubKey = Cache.get<string>("jmj_pub_key");
    const priKey = Cache.get<string>("jmj_pri_key");
    if (pubKey != null && priKey != null) {
      setPublicKey(pubKey);
      setPrivateKey(priKey);
    }
    const symmetricKey = Cache.get<string>("jmj_sym_key");
    if (symmetricKey != null) {
      setSymmetricKey(symmetricKey);
    }
  }, []);

  return (
    <div className="mb-4 bg-white/5 p-3 rounded border border-white/10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <AlgorithmSelector value={algorithm} onChange={setAlgorithm} />

        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <KeyDisplay label="公钥" value={publicKey} id="publicKey" />
          <KeyDisplay label="私钥" value={privateKey} id="privateKey" />

          <button
            onClick={generateKeys}
            disabled={publicKey != "" && privateKey != ""}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-300"
          >
            生成
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="symmetricKey" className="block text-white font-medium mb-2">对称加密密钥</label>
        <input
          id="symmetricKey"
          value={symmetricKey}
          readOnly
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50"
          placeholder="协商后将显示对称加密密钥..."
        />
      </div>
      <button
        onClick={negotiateKey}
        disabled={symmetricKey != ""}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-300"
      >
        协商加密key
      </button>
    </div>
  );
};

export default KeyGenerationSection;