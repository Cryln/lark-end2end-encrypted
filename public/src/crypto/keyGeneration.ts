import { SUPPORTED_ALGORITHMS, ERROR_MESSAGES } from '../constants/algorithms';
import type { SupportedAlgorithmConfig } from '../constants/types';
import { arrayBufferToBase64 } from '../utils/convert';

/**
 * 生成密钥对
 * @param algorithm - 加密算法名称
 * @returns 包含公钥和私钥的对象
 * @throws 当算法不支持或生成失败时抛出错误
 */
async function generateKeyPair(algorithm: string): Promise<{ publicKey: string; privateKey: string }> {
  // 检查算法是否支持
  const algoConfig = SUPPORTED_ALGORITHMS[algorithm as keyof typeof SUPPORTED_ALGORITHMS];
  if (!algoConfig) {
    throw new Error(ERROR_MESSAGES.UNSUPPORTED_ALGORITHM + algorithm);
  }

  if (!algoConfig.supported) {
    throw new Error(ERROR_MESSAGES.KEY_GENERATION_FAILED + algoConfig.name + '算法');
  }

  // 类型断言：由于已检查supported为true，可以安全地转换为SupportedAlgorithmConfig
  const supportedAlgoConfig = algoConfig as SupportedAlgorithmConfig;

  // 确保window.crypto可用
  if (!window.crypto) {
    throw new Error(ERROR_MESSAGES.CRYPTO_NOT_SUPPORTED);
  }

  try {
    // 生成密钥对
    const keyPair = await window.crypto.subtle.generateKey(
      supportedAlgoConfig.generateOptions,
      true,
      ['sign', 'verify']
    );

    // 导出公钥
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', (keyPair as CryptoKeyPair).publicKey);
    const publicKey = arrayBufferToBase64(publicKeyBuffer);

    // 导出私钥
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', (keyPair as CryptoKeyPair).privateKey);
    const privateKey = arrayBufferToBase64(privateKeyBuffer);

    return { publicKey, privateKey };
  } catch (error) {
    console.error('生成密钥失败:', error);
    throw new Error(ERROR_MESSAGES.KEY_GENERATION_FAILED + (error as Error).message);
  }
}

export { generateKeyPair };