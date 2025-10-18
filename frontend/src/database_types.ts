// feat: 创建此文件以存放从后端共享的数据库类型定义
// 从原 packages/database/schema.ts 迁移过来的类型定义

// 定义 Header 类型，用于存储邮件头信息
export type Header = Record<string, string>;

// 定义 Address 类型，用于存储发件人、收件人等地址信息
export type Address = {
  address: string;
  name: string;
};

// 定义 Email 类型，这是邮件对象的主要结构
export type Email = {
    id: string;
    messageFrom: string;
    messageTo: string;
    headers: Header[];
    from: Address;
    sender: Address | null;
    replyTo: Address[] | null;
    deliveredTo: string | null;
    returnPath: string | null;
    to: Address[] | null;
    cc: Address[] | null;
    bcc: Address[] | null;
    subject: string | null;
    messageId: string;
    inReplyTo: string | null;
    references: string | null;
    date: string | null;
    html: string | null;
    text: string | null;
    createdAt: Date; // 注意：这里是Date类型，但在API传输时通常是字符串，使用时请注意转换
    updatedAt: Date; // 注意：同上
};