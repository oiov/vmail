import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react';
// fix: 将具名导入 { useWindowSize } 更改为默认导入 useWindowSize
import useWindowSize from '../hooks/use-window-size';
import Leaflet from './leaflet';

// 将默认导出（export default）改为具名导出（export）
export function Modal({
  children,
  showModal,
  setShowModal,
}: {
  children: React.ReactNode;
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useWindowSize();

  // close modal on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef, setShowModal]);


  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    },
    [setShowModal],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // 修复：在移动端，只有当 showModal 为 true 时才渲染 Leaflet 组件。
  // 这可以防止它在所有页面加载时都默认弹出。
  // 同时，添加 showBlur={true} 属性以显示背景遮罩。
  if (isMobile) {
    return showModal ? (
      <Leaflet setShow={setShowModal} showBlur={true}>
        {children}
      </Leaflet>
    ) : null;
  }

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <div
            className="relative z-50 w-full max-w-lg"
            ref={modalRef}
          >
            {children}
          </div>
        </div>
      )}
    </>
  );
}