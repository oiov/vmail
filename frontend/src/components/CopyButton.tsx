import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
// 关键修正：为图标导入添加 .tsx 扩展名
import CheckIcon from './icons/CheckIcon.tsx'; 
import CopyIcon from './icons/CopyIcon.tsx';   

interface CopyButtonProps {
  text: string;
  className?: string; // 允许传入 className
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { t } = useTranslation(); // feat: 引入 i18n

  const handleCopy = async () => {
    try {
      // 尝试使用 Clipboard API 复制文本
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success(t('Copied to clipboard')); // feat: 使用全局 toast 提示
    } catch (err) {
      console.error('复制文本失败: ', err);
    }
  };

  // 复制成功后，2秒后重置图标状态
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <button
      onClick={handleCopy}
      // 使用 clsx 合并基础样式和传入的 className
      className={clsx(
        // fix: 彻底移除浏览器在按钮聚焦时默认添加的边框/轮廓
        "focus:outline-none focus-visible:outline-none",
        className
      )}
      aria-label="Copy to clipboard"
    >
      {isCopied ? (
        <CheckIcon className="h-5 w-5 text-green-500" />
      ) : (
        <CopyIcon className="h-5 w-5 text-gray-400" />
      )}
    </button>
  );
}

