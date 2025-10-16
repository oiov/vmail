import { useState, useEffect } from 'react';
// 关键修正：为图标导入添加 .tsx 扩展名
import { CheckIcon } from './icons/CheckIcon.tsx'; 
import { CopyIcon } from './icons/CopyIcon.tsx';   

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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
      className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
      aria-label="Copy to clipboard"
    >
      {isCopied ? (
        <CheckIcon className="h-5 w-5 text-green-500" />
      ) : (
        <CopyIcon className="h-5 w-5 text-gray-500" />
      )}
    </button>
  );
}