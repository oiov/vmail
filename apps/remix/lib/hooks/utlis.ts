export function getRandomCharacter(): string {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.";
  return characters.charAt(Math.floor(Math.random() * characters.length));
}
