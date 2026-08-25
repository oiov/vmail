// worker/src/sender.ts — 兼容转发层（真实实现已移至 mailboxIdentity.ts / outbound.ts）
// 保留此文件仅为向后兼容既有 import { ... } from './sender' 的调用方
export {
  isAllowedMailboxAddress,
  createMailboxToken,
  verifyMailboxToken,
  getBearerToken,
  createMailboxIdentity,
  parseAllowedDomains,
} from "./mailboxIdentity.ts";
export type { MailboxIdentity } from "./mailboxIdentity.ts";
export {
  getConfiguredSendChannel,
  sendRequestSchema,
  escapeHtml,
  appendSenderAttribution,
  getProviderSenderName,
  quoteDisplayName,
  buildResendPayload,
  buildMailChannelsPayload,
  buildCloudflareMimeMessage,
  sendEmail,
} from "./outbound.ts";
export type {
  SendChannel,
  SenderEnv,
  SendRequest,
  OutgoingEmail,
} from "./outbound.ts";
