// worker/src/utils.ts
/**
 * 使用密钥对文本进行简单的 XOR 加密。
 * @param text 要加密的文本。
 * @param secret 加密密钥。
 * @returns 加密后的 Base64 编码字符串。
 */
export function encrypt(text: string, secret: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    // 对每个字符的 ASCII 码与密钥中对应位置的字符 ASCII 码进行异或操作
    result += String.fromCharCode(text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  // 将加密后的结果转换为 Base64 编码，使其更安全地传输
  return btoa(result);
}

/**
 * 使用密钥对 Base64 编码的加密文本进行解密。
 * @param encryptedText 加密后的 Base64 编码字符串。
 * @param secret 解密密钥。
 * @returns 解密后的原始文本。
 */
export function decrypt(encryptedText: string, secret: string): string {
  // 首先对 Base64 编码的字符串进行解码
  const text = atob(encryptedText);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    // 同样进行异或操作来还原原始字符
    result += String.fromCharCode(text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return result;
}