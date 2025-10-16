import { createCookie } from "@remix-run/node";

const secrets = (process.env.COOKIES_SECRET || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// console.log("secrets", secrets);

export const userMailboxCookie = createCookie("userMailbox", {
  maxAge: Number(process.env.EXPIRY_TIME) || 86400, // default for one day (86400 seconds)
  secrets: secrets,
  httpOnly: true,
});
