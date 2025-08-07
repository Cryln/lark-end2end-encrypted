import { SUPPORTED_ALGORITHMS, ERROR_MESSAGES } from '../constants/algorithms';
import type { SupportedAlgorithmConfig } from '../constants/types';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../utils/convert';


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
      ['encrypt', 'decrypt']
    );

    // 注意: 更改了密钥用途为加密解密，请确保supportedAlgoConfig配置也支持这些操作

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

/**
 * 导入公钥
 * @param publicKey - Base64编码的公钥字符串
 * @param algorithm - 加密算法名称
 * @returns 导入的CryptoKey对象
 * @throws 当导入失败时抛出错误
 */
async function importPublicKey(publicKey: string, algorithm: string): Promise<CryptoKey> {
  const algoConfig = SUPPORTED_ALGORITHMS[algorithm as keyof typeof SUPPORTED_ALGORITHMS];
  if (!algoConfig || !algoConfig.supported) {
    throw new Error(ERROR_MESSAGES.UNSUPPORTED_ALGORITHM + algorithm);
  }

  const supportedAlgoConfig = algoConfig as SupportedAlgorithmConfig;
  const publicKeyBuffer = base64ToArrayBuffer(publicKey);

  try {
    return await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      supportedAlgoConfig.generateOptions,
      true,
      ['encrypt']
    );
  } catch (error) {
    console.error('导入公钥失败:', error);
    throw new Error(ERROR_MESSAGES.IMPORT_PUBLIC_KEY_FAILED + (error as Error).message);
  }
}

/**
 * 导入私钥
 * @param privateKey - Base64编码的私钥字符串
 * @param algorithm - 加密算法名称
 * @returns 导入的CryptoKey对象
 * @throws 当导入失败时抛出错误
 */
async function importPrivateKey(privateKey: string, algorithm: string): Promise<CryptoKey> {
  const algoConfig = SUPPORTED_ALGORITHMS[algorithm as keyof typeof SUPPORTED_ALGORITHMS];
  if (!algoConfig || !algoConfig.supported) {
    throw new Error(ERROR_MESSAGES.UNSUPPORTED_ALGORITHM + algorithm);
  }

  const supportedAlgoConfig = algoConfig as SupportedAlgorithmConfig;
  const privateKeyBuffer = base64ToArrayBuffer(privateKey);

  try {
    return await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      supportedAlgoConfig.generateOptions,
      true,
      ['decrypt']
    );
  } catch (error) {
    console.error('导入私钥失败:', error);
    throw new Error(ERROR_MESSAGES.IMPORT_PRIVATE_KEY_FAILED + (error as Error).message);
  }
}

/**
 * 加密数据
 * @param data - 要加密的字符串数据
 * @param publicKey - Base64编码的公钥字符串
 * @param algorithm - 加密算法名称
 * @returns 加密后的Base64字符串
 * @throws 当加密失败时抛出错误
 */
async function encrypt(data: string, publicKey: string, algorithm: string): Promise<string> {
  try {
    const cryptoPublicKey = await importPublicKey(publicKey, algorithm);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: cryptoPublicKey.algorithm.name },
      cryptoPublicKey,
      dataBuffer
    );

    return arrayBufferToBase64(encryptedBuffer);
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error(ERROR_MESSAGES.ENCRYPTION_FAILED + (error as Error).message);
  }
}

/**
 * 解密数据
 * @param encryptedData - 要解密的Base64字符串
 * @param privateKey - Base64编码的私钥字符串
 * @param algorithm - 加密算法名称
 * @returns 解密后的字符串数据
 * @throws 当解密失败时抛出错误
 */
async function decrypt(encryptedData: string, privateKey: string, algorithm: string): Promise<string> {
  try {
    const cryptoPrivateKey = await importPrivateKey(privateKey, algorithm);
    const encryptedBuffer = base64ToArrayBuffer(encryptedData);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: cryptoPrivateKey.algorithm.name },
      cryptoPrivateKey,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error(ERROR_MESSAGES.DECRYPTION_FAILED + (error as Error).message);
  }
}

export { generateKeyPair, encrypt, decrypt };
