const encoder = new TextEncoder();
const encode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
const decode = (value: string) =>
  Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (c) =>
    c.charCodeAt(0),
  );
const hmac = (secret: string) =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
export async function hashToken(token: string) {
  return encode(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(token)),
    ),
  );
}
export async function generateUserKey(userId: string, secret: string) {
  const body = [
    "vmail2",
    encode(encoder.encode(userId)),
    encode(crypto.getRandomValues(new Uint8Array(32))),
  ].join(".");
  return (
    body +
    "." +
    encode(
      new Uint8Array(
        await crypto.subtle.sign(
          "HMAC",
          await hmac(secret),
          encoder.encode(body),
        ),
      ),
    )
  );
}
export async function getKeyOwner(
  token: string,
  secret: string,
): Promise<string | null> {
  if (token.length > 512) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "vmail2") return null;
  try {
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        await hmac(secret),
        decode(parts[3]),
        encoder.encode(parts.slice(0, 3).join(".")),
      ))
    )
      return null;
    const owner = new TextDecoder().decode(decode(parts[1]));
    return owner.length > 0 && owner.length <= 128 ? owner : null;
  } catch {
    return null;
  }
}
