// 修复：将命名导出 'export function' 改为默认导出 'export default function'
// 这确保了组件导出方式的一致性，解决了Vite构建过程中的解析错误。
export default function ArrowUturnLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
      />
    </svg>
  );
}
