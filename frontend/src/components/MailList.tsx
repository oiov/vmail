import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Email } from 'database';

// 图标导入
import MailIcon from './icons/MailIcon.tsx'; // 修复：将命名导入 { MailIcon } 改为默认导入 MailIcon
import RefreshIcon from './icons/RefreshIcon.tsx';
import Loader from './icons/Loader.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';

interface MailListProps {
  emails: Email[];
  isLoading: boolean;
  onDelete: (ids: string[]) => void;
  isDeleting: boolean;
  onRefresh: () => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function MailList({ emails, isLoading, onDelete, isDeleting, onRefresh, selectedIds, setSelectedIds }: MailListProps) {
  const { t } = useTranslation();

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  
  const handleSelectAll = () => {
    if (emails.length === 0) return;
    if (selectedIds.length === emails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map(e => e.id));
    }
  };

  return (
    <div className="rounded-md border border-cyan-50/20 text-white">
      {/* 邮件列表头部 */}
      <div className="w-full rounded-t-md p-2 flex items-center bg-zinc-800 text-zinc-200 gap-2">
        <div className="flex items-center justify-start gap-2 font-bold">
          <MailIcon className="size-6" />
          {t("INBOX")}
          {emails.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-zinc-600 rounded-full">
              {emails.length}
            </span>
          )}
        </div>
        
        {/* 操作按钮区域 */}
        <div className="ml-auto flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded bg-zinc-700 border-zinc-600"
              title='全选'
              checked={emails.length > 0 && selectedIds.length === emails.length}
              onChange={handleSelectAll}
            />
            <button
              onClick={() => onDelete(selectedIds)}
              disabled={selectedIds.length === 0 || isDeleting}
              className="p-1 rounded text-red-500 disabled:text-gray-500 hover:text-red-400"
              title="删除选中"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <button
              className="p-1 rounded"
              title="refresh"
              onClick={onRefresh}>
              <RefreshIcon
                className={
                  isLoading
                    ? "animate-spin"
                    : "size-6 hover:animate-spin active:opacity-20 transition-all duration-300"
                }
              />
            </button>
        </div>
      </div>

      {/* 邮件列表主体 */}
      <div className="grids flex flex-col flex-1 h-[488px] overflow-y-auto p-2">
        {isLoading && (
          <div className="w-full items-center h-full flex-col justify-center flex">
            <Loader />
            <p className="text-zinc-400 mt-6">{t("Waiting for emails...")}</p>
          </div>
        )}
        {!isLoading && emails.length === 0 && (
          <div className="w-full items-center h-full flex-col justify-center flex">
            <Loader />
            <p className="text-zinc-400 mt-6">{t("Waiting for emails...")}</p>
          </div>
        )}
        {emails.map((email: Email) => (
          <div key={email.id} className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              className="h-4 w-4 rounded bg-zinc-700 border-zinc-600"
              checked={selectedIds.includes(email.id)}
              onChange={() => handleSelect(email.id)}
            />
            <Link
              to={`/mails/${email.id}`}
              className="flex-1 flex flex-col items-start gap-2 rounded-lg border border-zinc-600 p-3 text-left text-sm transition-all hover:bg-zinc-700"
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{email.from?.name || email.messageFrom}</div>
                  </div>
                  <div className={"ml-auto text-xs"}>
                    {formatDistanceToNow(new Date(email.date || email.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </div>
                </div>
                <div className="text-xs font-medium">{email.subject}</div>
              </div>
              <div className="line-clamp-2 text-xs text-zinc-300 font-normal w-full">
                {(email.text || email.html || "").substring(0, 300)}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

