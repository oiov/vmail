export function getRandomCharacter(): string {
  const characters = "abcdefghijklmnopqrstuvwxyz.";
  return characters.charAt(Math.floor(Math.random() * characters.length));
}
