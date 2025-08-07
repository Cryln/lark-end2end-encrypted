import React from 'react';
import { ERROR_MESSAGES } from '../constants/algorithms';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../utils/convert';
import { decrypt, encrypt } from '../crypto/keyGeneration';
import { log } from './LogDisplay';

interface EncryptionSectionProps {
  publicKey: string;
  privateKey: string;
  plaintext: string;
  setPlaintext: (text: string) => void;
  ciphertext: string;
  setCiphertext: (text: string) => void;
  symmetricKey: string;
}

/**
 * 加密功能区域组件
 * 包含原文输入、加密按钮、密文显示和发送按钮
 */
const EncryptionSection: React.FC<EncryptionSectionProps> = ({
  publicKey,
  privateKey,
  plaintext,
  setPlaintext,
  ciphertext,
  setCiphertext,
  symmetricKey,
}) => {

  // 加密功能
  const encryptText = async () => {
    if (!plaintext) {
      alert(ERROR_MESSAGES.EMPTY_PLAINTEXT)
      return
    }
    // if (!symmetricKey) {
    //   setCiphertext(plaintext)
    //   return
    // }
    const src = plaintext
    let dst = ''
    log(`[加密]publicKey:${publicKey};privateKey:${privateKey}`)
    if (publicKey != '') {
      dst = await encrypt(src, publicKey, 'rsa')
      log(`[加密]密文：${dst}`)
    }
    if (privateKey != '') {
      const dst2 = await decrypt(dst, privateKey, 'rsa')
      log(`[加密]原文：${dst2}`)
      setCiphertext(dst+ '\n' + dst2)
      return
    }

    try {
      // 将Base64密钥转换为ArrayBuffer
      const keyBuffer = base64ToArrayBuffer(symmetricKey);
      // 导入密钥
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-CBC' },
        false,
        ['encrypt']
      );

      // 生成16字节随机IV
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
      // 将原文转换为ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // 加密
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: iv },
        key,
        data
      );

      // 组合IV和密文并转换为Base64
      const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
      setCiphertext(arrayBufferToBase64(combined.buffer));
    } catch (error) {
      console.error('加密失败:', error);
      alert('加密失败: ' + (error as Error).message);
    }
  }

  // 发送功能
  const sendCiphertext = async () => {
    if (!ciphertext) {
      alert(ERROR_MESSAGES.EMPTY_CIPHERTEXT)
      return
    }
  }

  // 在组件初始化时调用getBlockActionSourceDetail
  // useEffect(() => {
  //   async function fetchMessageDetail() {
  //     try {
  //       const messageDetail = await getBlockActionSourceDetail();
  //       // 假设消息详情中的content字段包含需要加密的原文
  //       if (messageDetail && messageDetail.content) {
  //         // 如果content是字符串，直接设置
  //         if (typeof messageDetail.content === 'string') {
  //           setPlaintext(messageDetail.content);
  //         }
  //         // 如果content是对象，尝试获取其中的文本内容
  //         else if (typeof messageDetail.content === 'object') {
  //           // 这里假设对象中有text或message字段
  //           const text = messageDetail.content.text || messageDetail.content.message || JSON.stringify(messageDetail.content);
  //           setPlaintext(text);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('获取消息详情失败:', error);
  //     }
  //   }

  //   fetchMessageDetail();
  // }, [setPlaintext]);

  return (
    <div className="space-y-4">
      {/* 原文输入区域 */}
      <div>
        <label htmlFor="plaintext" className="block text-white font-medium mb-2">原文</label>
        <textarea
          id="plaintext"
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          className="w-full px-3 py-3 border border-white/20 rounded-md bg-white/10 text-white min-h-[100px]"
          placeholder="请输入需要加密的文本..."
        ></textarea>
        <button
          onClick={encryptText}
          className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-300"
        >
          加密
        </button>
      </div>

      {/* 密文显示区域 */}
      <div>
        <label htmlFor="ciphertext" className="block text-white font-medium mb-2">密文</label>
        <textarea
          id="ciphertext"
          value={ciphertext}
          readOnly
          className="w-full px-3 py-3 border border-white/20 rounded-md bg-white/5 text-white min-h-[100px]"
          placeholder="加密后的文本将显示在这里..."
        ></textarea>
        <button
          onClick={sendCiphertext}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-300"
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default EncryptionSection;