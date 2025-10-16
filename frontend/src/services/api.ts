import axios from 'axios';
import { Email } from 'database/schema'; // 假设您可以从数据库包中导入类型

// 定义 Turnstile 人机验证所需的 token
interface ApiPayload {
  token: string;
  [key: string]: any;
}

// 获取邮件列表
export const getEmails = async (address: string, token: string): Promise<Email[]> => {
  const response = await axios.post('/api/emails', { address, token });
  return response.data;
};

// 获取单个邮件详情
export const getEmailById = async (id: string): Promise<Email> => {
  const response = await axios.get(`/api/emails/${id}`);
  return response.data;
};

// 删除邮件
export const deleteEmails = async (ids: string[], token: string): Promise<any> => {
  const response = await axios.post('/api/delete-emails', { ids, token });
  return response.data;
};

// ... 您可以在此添加更多 API 调用函数