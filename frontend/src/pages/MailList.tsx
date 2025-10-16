import { useState } from 'react';
import { Link } from 'react-router-dom'; // 使用 react-router-dom 的 Link 组件
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Email } from 'database/schema';

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
      if (selectedIds.length === emails.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(emails.map(e => e.id));
      }
  }

  return (
    <div>
      {/* 操作按钮 */}
      <div className="my-2">
        <button onClick={handleSelectAll}>
            {selectedIds.length === emails.length ? '取消全选' : '全选'}
        </button>
        <button
          onClick={() => onDelete(selectedIds)}
          disabled={selectedIds.length === 0 || isDeleting}
          className="ml-4 bg-red-500 text-white p-2 disabled:bg-gray-400"
        >
          {isDeleting ? '删除中...' : `删除选中的 (${selectedIds.length})`}
        </button>
      </div>

      {/* 邮件列表 */}
      <ul className="border rounded">
        {emails.map((email) => (
          <li key={email.id} className="flex items-center border-b p-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(email.id)}
              onChange={() => handleSelect(email.id)}
              className="mr-4"
            />
            <Link to={`/mails/${email.id}`} className="flex-grow">
              <div className="flex justify-between">
                <span>{email.messageFrom}</span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(email.createdAt), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </span>
              </div>
              <div className="font-bold">{email.subject}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}