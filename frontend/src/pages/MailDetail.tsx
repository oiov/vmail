import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getEmailById } from '../services/api';
import { useTranslation } from "react-i18next";
import { format } from "date-fns/format";

// 导入图标
// 修复：将命名导入更改为默认导入，以匹配图标组件的导出方式
import ArrowUturnLeft from '../components/icons/ArrowUturnLeft.tsx';
import UserCircleIcon from '../components/icons/UserCircleIcon.tsx';

export function MailDetail() {
  const { t } = useTranslation();
  // 从 URL 中获取邮件 ID
  const { id } = useParams<{ id: string }>();

  // 使用 useQuery 根据 ID 获取单个邮件的详细信息
  const { data: email, isLoading, isError, error } = useQuery({
    queryKey: ['email', id], // 查询的唯一键，包含邮件 ID
    queryFn: () => getEmailById(id!), // 获取数据的函数
    enabled: !!id, // 只有在 id 存在时才执行查询
  });

  // 处理邮件内容的显示，将 HTML 字符串渲染到 iframe 中
  const createMarkup = (htmlContent: string) => {
    // 为了安全，最好对 htmlContent 进行清理，这里为了简化直接使用
    return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  };
  
  if (isLoading) {
    return <div className="text-center p-8 text-white">加载中...</div>;
  }

  if (isError) {
    return (
       <div className="mt-24 mx-6 md:mx-10 flex flex-1 flex-col p-2 gap-10 text-white">
        <Link
          to="/"
          className="flex w-fit font-semibold items-center border p-2 rounded-md gap-2">
          <ArrowUturnLeft />
          {t("Back Home")}
        </Link>
        <div className="flex items-center justify-center font-semibold text-xl text-red-500">
          加载邮件失败: {error.message}
        </div>
      </div>
    );
  }

  if (!email) {
    return (
       <div className="mt-24 mx-6 md:mx-10 flex flex-1 flex-col p-2 gap-10 text-white">
        <Link
          to="/"
          className="flex w-fit font-semibold items-center border p-2 rounded-md gap-2">
          <ArrowUturnLeft />
           {t("Back Home")}
        </Link>
        <div className="flex items-center justify-center font-semibold text-xl text-red-500">
          未找到该邮件。
        </div>
      </div>
    );
  }

  return (
    <div className="mt-24 mx-6 md:mx-10 flex flex-1 flex-col p-2 gap-10">
      <Link
        to="/"
        className="flex text-white w-fit font-semibold items-center border p-2 rounded-md gap-2">
        <ArrowUturnLeft />
        {t("Back Home")}
      </Link>
      <div className="flex items-start text-white">
        <div className="flex items-start gap-4 text-sm">
          <div>
            <UserCircleIcon className="w-6 h-6"/>
          </div>
          <div className="grid gap-1">
            <div className="font-semibold">{email.from.name}</div>
            <div className="line-clamp-1 text-xs">{email.subject}</div>
            <div className="line-clamp-1 text-xs">
              <span className="font-medium">{t("Reply-To:")}</span> {email.from.address}
            </div>
          </div>
        </div>
        {email.date && (
          <div className="ml-auto text-xs text-muted-foreground">
            {format(new Date(email.date), "PPpp")}
          </div>
        )}
      </div>
      <div className="flex-1 flex text-sm bg-[#ffffffd6] backdrop-blur-xl rounded-md p-3 min-h-0">
        <iframe
            srcDoc={email.html || `<pre>${email.text}</pre>`}
            className="w-full h-[60vh] border-0"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            title="Email Content"
          />
      </div>
    </div>
  );
}

