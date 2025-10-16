// refactor: 将导入从 'database' 包更改为本地的类型定义文件
import type { Email } from '../database_types';

const API_BASE_URL = '/api';

// fix: 移除不再需要的 ApiPayload 接口定义

// 获取邮件列表
// fix: 移除 getEmails 函数中的 token 参数，因为后端已不再需要它
export async function getEmails(address: string): Promise<Email[]> {
  const response = await fetch(`${API_BASE_URL}/emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // fix: 请求体中只发送 address
    body: JSON.stringify({ address }),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

// feat: 新增函数，用于在创建邮箱前验证人机校验token
export async function verifyTurnstile(token: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Turnstile verification failed');
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
// fix: 移除 deleteEmails 函数中的 token 参数
export async function deleteEmails(ids: string[]): Promise<{ count: number }> {
    const response = await fetch(`${API_BASE_URL}/delete-emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // fix: 请求体中只发送 ids
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete emails');
    }
    return response.json();
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
