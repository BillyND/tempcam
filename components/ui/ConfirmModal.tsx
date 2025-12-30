import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Đồng ý',
  cancelLabel = 'Hủy',
  isDestructive = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-gray-800 divide-x divide-gray-800">
          <button 
            onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors active:bg-gray-700"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3.5 text-sm font-bold hover:bg-gray-800 transition-colors active:bg-gray-700 ${isDestructive ? 'text-red-500' : 'text-blue-500'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};