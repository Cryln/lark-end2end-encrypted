import React, { useEffect } from 'react';
import AlgorithmSelector from './AlgorithmSelector';
import KeyDisplay from './KeyDisplay';
import CacheService from '../utils/cache';
import { generateKeyPair } from '../../src/crypto/keyGeneration';
import { logError } from './LogDisplay';

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
  console.log(symmetricKey)

// 生成密钥对
  const generateKeys = async () => {
    try {
      setPublicKey('生成中...');
      setPrivateKey('生成中...');
      const { publicKey, privateKey } = await generateKeyPair(algorithm);
      setPublicKey(publicKey);
      setPrivateKey(privateKey);
      CacheService.set("jmj_pub_key", publicKey);
      CacheService.set("jmj_pri_key", privateKey);
    } catch (error) {
      logError(`生成密钥对失败: ${(error as Error).message}`);
      alert((error as Error).message);
      setPublicKey('');
      setPrivateKey('');
    }
  }

  const clearAll = async () => {
    try {
      CacheService.clear();
      setPublicKey('');
      setPrivateKey('');
      setSymmetricKey('');
    } catch (error) {
      
    }
  }

  useEffect(() => {
    const pubKey = CacheService.get<string>("jmj_pub_key");
    const priKey = CacheService.get<string>("jmj_pri_key");
    if (pubKey != null && priKey != null) {
      setPublicKey(pubKey);
      setPrivateKey(priKey);
    } else {
      generateKeys()
    }
  }, []);

  return (
    <div className="mb-4 bg-white/5 p-3 rounded border border-white/10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <AlgorithmSelector value={algorithm} onChange={setAlgorithm}/>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <KeyDisplay label="公钥" value={publicKey} id="publicKey" />
          <KeyDisplay label="私钥" value={privateKey} id="privateKey" />

          <button
            onClick={clearAll}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-300"
          >
            一键清空
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyGenerationSection;