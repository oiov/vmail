import { useState } from 'react';
import { Link } from 'react-router-dom'; // <--- 关键修正：使用 react-router-dom
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Email } from 'database/schema';
import { TrashIcon } from './icons/TrashIcon'; // 确保图标路径正确
import { WaitingEmail } from './icons/waiting-email'; // 确保图标路径正确

// 组件 props 定义
interface MailListProps {
  emails: Email[];
  onDelete: (ids: string[]) => void;
  isDeleting: boolean;
}

export function MailList({ emails, onDelete, isDeleting }: MailListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  // 如果没有邮件，显示提示信息
  if (emails.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <WaitingEmail className="w-24 h-24 mx-auto text-gray-300" />
        <p className="mt-4 text-gray-500">正在等待接收邮件...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* 操作按钮 */}
      <div className="p-4 border-b flex items-center space-x-4">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={emails.length > 0 && selectedIds.length === emails.length}
          onChange={handleSelectAll}
        />
        <button
          onClick={() => onDelete(selectedIds)}
          disabled={selectedIds.length === 0 || isDeleting}
          className="flex items-center space-x-2 text-red-500 disabled:text-gray-400 hover:text-red-700 disabled:hover:text-gray-400"
        >
          <TrashIcon className="w-5 h-5" />
          <span>{isDeleting ? '删除中...' : `删除 (${selectedIds.length})`}</span>
        </button>
      </div>

      {/* 邮件列表 */}
      <ul className="divide-y">
        {emails.map((email) => (
          <li key={email.id} className="flex items-center p-4 hover:bg-gray-50">
            <input
              type="checkbox"
              className="h-4 w-4 mr-4"
              checked={selectedIds.includes(email.id)}
              onChange={() => handleSelect(email.id)}
            />
            <Link to={`/mails/${email.id}`} className="flex-grow grid grid-cols-3 gap-4 items-center">
              <span className="font-semibold truncate col-span-1">{email.messageFrom}</span>
              <span className="text-gray-700 truncate col-span-1">{email.subject}</span>
              <span className="text-sm text-gray-500 truncate col-span-1 text-right">
                {formatDistanceToNow(new Date(email.createdAt), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}