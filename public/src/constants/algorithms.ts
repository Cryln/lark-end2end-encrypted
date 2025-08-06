// 导入类型定义
import type { AlgorithmConfig, SupportedAlgorithmConfig } from './types';

// 算法元数据配置
const ALGORITHM_METADATA: Record<string, Omit<AlgorithmConfig, 'supported'> & { defaultGenerateOptions?: any }> = {
  rsa: {
    name: 'RSA',
    description: 'RSA算法是一种非对称加密算法，广泛用于安全数据传输',
    defaultGenerateOptions: {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256'
    }
  },
  ecdsa: {
    name: 'ECDSA',
    description: 'ECDSA是基于椭圆曲线密码学的数字签名算法',
    defaultGenerateOptions: {
      name: 'ECDSA',
      namedCurve: 'P-256'
    }
  }
};

// 动态生成浏览器支持的算法列表
function generateSupportedAlgorithms(): Record<string, AlgorithmConfig | SupportedAlgorithmConfig> {
  const result: Record<string, AlgorithmConfig | SupportedAlgorithmConfig> = {};
  const isBrowserEnvironment = typeof window !== 'undefined';
  const isCryptoSupported = isBrowserEnvironment && window.crypto && window.crypto.subtle;

  // 检测每个算法是否支持
  Object.entries(ALGORITHM_METADATA).forEach(([key, metadata]) => {
    let supported = false;
    let generateOptions = undefined;

    if (isCryptoSupported) {
      // 尝试检测算法是否支持
      try {
        // 这里是简化的检测方法，实际项目中可能需要更复杂的检测
        if (key === 'rsa') {
          // RSA通常在浏览器中支持
          supported = true;
          generateOptions = metadata.defaultGenerateOptions;
        } else if (key === 'ecdsa') {
          // ECDSA通常在浏览器中支持
          supported = true;
          generateOptions = metadata.defaultGenerateOptions;
        }
        // 可以根据需要添加更多算法的检测
      } catch (e) {
        console.error(`检测算法${key}支持性时出错:`, e);
      }
    } else if (!isBrowserEnvironment) {
      // 非浏览器环境，默认不支持任何算法
      supported = false;
    }

    if (supported && generateOptions) {
      result[key] = {
        ...metadata,
        supported: true,
        generateOptions
      };
    } else {
      result[key] = {
        ...metadata,
        supported: false
      };
    }
  });

  return result;
}

// 支持的加密算法列表 - 动态生成
const SUPPORTED_ALGORITHMS: Record<string, AlgorithmConfig | SupportedAlgorithmConfig> = generateSupportedAlgorithms();

// 错误消息常量
const ERROR_MESSAGES = {
  CRYPTO_NOT_SUPPORTED: '浏览器不支持Web Crypto API',
  UNSUPPORTED_ALGORITHM: '不支持的算法: ',
  KEY_GENERATION_FAILED: '生成密钥失败: ',
  EMPTY_PLAINTEXT: '请输入原文',
  EMPTY_CIPHERTEXT: '请先加密生成密文'
};

export { SUPPORTED_ALGORITHMS, ERROR_MESSAGES };