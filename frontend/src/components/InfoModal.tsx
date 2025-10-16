import { Modal } from './modal';
import Close from './icons/Close';
import React from 'react';

interface InfoModalProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  children: React.ReactNode;
}

export function InfoModal({ showModal, setShowModal, title, children }: InfoModalProps) {
  return (
    <Modal showModal={showModal} setShowModal={setShowModal}>
      {/* 修复：将背景色从白色更改为网站的深色主题，并调整边框颜色 */}
      <div className="w-full max-h-[80vh] flex flex-col bg-neutral-800/95 backdrop-blur-xl shadow-xl md:max-w-3xl md:rounded-2xl md:border md:border-cyan-50/20">
        {/* 修复：创建一个固定的头部，包含标题和关闭按钮，使其不随内容滚动 */}
        <div className="flex-shrink-0 flex items-center justify-center p-4 border-b border-cyan-50/20 relative">
            <h3 className="font-display text-2xl font-bold text-white">{title}</h3>
            <Close
              className="absolute top-4 right-4 h-6 w-6 text-gray-400 hover:text-white cursor-pointer"
              onClick={() => setShowModal(false)}
              onPointerDown={(e) => e.stopPropagation()}
            />
        </div>

        {/* 修复：为内容区域添加 overflow-y-auto，使其可独立滚动 */}
        <div className="flex-grow overflow-y-auto text-white p-6">
            {/* 修复：将内容区域的文字颜色从黑色改为白色 */}
            <div className="text-white">{children}</div>
        </div>
      </div>
    </Modal>
  );
}