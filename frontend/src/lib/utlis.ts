/**
 * 使用密钥对文本进行简单的 XOR 加密。
 * @param text 要加密的文本。
 * @param secret 加密密钥。
 * @returns 加密后的 Base64 编码字符串。
 */
export function encrypt(text: string, secret: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    // 对每个字符的 ASCII 码与密钥中对应位置的字符 ASCII 码进行异或操作
    result += String.fromCharCode(
      text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length),
    );
  }
  // 将加密后的结果转换为 Base64 编码，使其更安全地传输
  return btoa(result);
}
