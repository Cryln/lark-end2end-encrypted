/**
 * 将ArrayBuffer转换为Base64字符串
 * @param buffer - 要转换的ArrayBuffer
 * @returns Base64编码的字符串
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

/**
 * 将Base64字符串转换为ArrayBuffer
 * @param base64 - 要转换的Base64字符串
 * @returns 转换后的ArrayBuffer
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  return bytes.map((_, i) => binaryString.charCodeAt(i)).buffer;
};

export { arrayBufferToBase64, base64ToArrayBuffer };