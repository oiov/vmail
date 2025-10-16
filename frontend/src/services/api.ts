// 导入 Email 类型，'database' 是您 monorepo 中的包名
import type { Email } from 'database';

const API_BASE_URL = '/api';

// 定义 Turnstile 人机验证所需的 token
// 恢复此接口定义，以备将来使用
interface ApiPayload {
  token: string;
  [key: string]: any;
}

// 获取邮件列表
export async function getEmails(address: string, token: string): Promise<Email[]> {
  const response = await fetch(`${API_BASE_URL}/emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, token }),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

// feat: 添加获取单封邮件详情的函数
export async function getEmailById(id: string): Promise<Email> {
  const response = await fetch(`${API_BASE_URL}/emails/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch email');
  }
  return response.json();
}

// 删除邮件
export async function deleteEmails(ids: string[], token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/delete-emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, token }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete emails');
    }
}

// feat: 添加密码登录函数
export async function loginByPassword(password: string, token: string): Promise<{ address: string }> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, token }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }
  return response.json();
}