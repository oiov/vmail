import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getEmailById } from '../services/api';
import { Header } from '../components/Header'; // 假设 Header 组件已迁移
import { Footer } from '../components/Footer'; // 假设 Footer 组件已迁移

export function MailDetail() {
  // 从 URL 中获取邮件 ID
  const { id } = useParams<{ id: string }>();

  // 使用 useQuery 根据 ID 获取单个邮件的详细信息
  const { data: email, isLoading, isError } = useQuery({
    queryKey: ['email', id], // 查询的唯一键，包含邮件 ID
    queryFn: () => getEmailById(id!), // 获取数据的函数
    enabled: !!id, // 只有在 id 存在时才执行查询
  });

  // 处理邮件内容的显示，将 HTML 字符串渲染到 iframe 中
  const createMarkup = (htmlContent: string) => {
    // 为了安全，最好对 htmlContent 进行清理，这里为了简化直接使用
    return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center">正在加载邮件内容...</p>;
    }
    if (isError || !email) {
      return <p className="text-center text-red-500">加载邮件失败，请返回重试。</p>;
    }
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h1 className="text-2xl font-bold mb-2">{email.subject}</h1>
          <p className="text-sm">
            <strong>发件人:</strong> {email.messageFrom}
          </p>
          <p className="text-sm">
            <strong>收件人:</strong> {email.messageTo}
          </p>
          <p className="text-sm text-gray-500">
            <strong>时间:</strong> {new Date(email.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="p-4">
          {/* 使用 iframe 来安全地沙箱化邮件内容 */}
          <iframe
            src={createMarkup(email.html || `<p>${email.text}</p>`)}
            className="w-full h-[60vh]"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            title="Email Content"
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <Header />
      <main className="container mx-auto p-4">
        <div className="mb-4">
          <Link to="/" className="text-blue-500 hover:underline">
            &larr; 返回收件箱
          </Link>
        </div>
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}