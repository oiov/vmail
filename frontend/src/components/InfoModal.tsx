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
      <div className="w-full max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-xl shadow-xl p-4 md:max-w-3xl md:rounded-2xl md:border md:border-gray-200">
        <Close
          className="absolute top-4 right-4 h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={() => setShowModal(false)}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-5 text-center md:px-16">
          <h3 className="font-display text-2xl font-bold">{title}</h3>
        </div>
        <div className="text-black p-4">{children}</div>
      </div>
    </Modal>
  );
}