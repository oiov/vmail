/**
 * 获取一个随机字符
 * @returns {string} 从 "abcdefghijklmnopqrstuvwxyz." 中随机选择一个字符
 */
export function getRandomCharacter(): string {
  const characters = "abcdefghijklmnopqrstuvwxyz.";
  return characters.charAt(Math.floor(Math.random() * characters.length));
}
