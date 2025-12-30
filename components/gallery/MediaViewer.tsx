import React, { useMemo, useState } from 'react';
import { X, Download, Trash2, Clock } from 'lucide-react';
import { MediaItem } from '../../types';
import { ConfirmModal } from '../ui/ConfirmModal';

interface MediaViewerProps {
  item: MediaItem | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ item, onClose, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Helper to memoize url, but handle null item gracefully
  const url = useMemo(() => {
    if (!item) return '';
    return URL.createObjectURL(item.blob);
  }, [item]);

  if (!item) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `tempcam-${item.id}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const timeLeft = Math.max(0, item.expiryDate - Date.now());
  const hoursLeft = Math.floor(timeLeft / 3600000);
  const minsLeft = Math.floor((timeLeft % 3600000) / 60000);

  return (
    <>
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10 backdrop-blur-sm">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-white/90">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                </span>
                <span className="text-xs text-red-400 flex items-center gap-1">
                    <Clock size={12} /> Còn lại: {hoursLeft}h {minsLeft}p
                </span>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-800/80 rounded-full text-white hover:bg-gray-700">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
            {item.type === 'video' ? (
                <video src={url} controls autoPlay className="max-h-full max-w-full" playsInline />
            ) : (
                <img src={url} alt="View" className="max-h-full max-w-full object-contain" />
            )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-black/80 flex justify-around items-center gap-8 backdrop-blur-md pb-safe">
            <button onClick={handleDownload} className="flex flex-col items-center gap-1 text-white hover:text-blue-400 active:scale-95 transition-transform">
                <Download size={24} />
                <span className="text-[10px]">Lưu</span>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="flex flex-col items-center gap-1 text-red-500 hover:text-red-400 active:scale-95 transition-transform">
                <Trash2 size={24} />
                <span className="text-[10px]">Xóa</span>
            </button>
        </div>
        </div>

        <ConfirmModal 
            isOpen={showDeleteConfirm}
            title="Xóa tệp tin này?"
            message="Bạn có chắc chắn muốn xóa không? Hành động này không thể hoàn tác."
            onConfirm={() => {
                onDelete(item.id);
                setShowDeleteConfirm(false);
                onClose();
            }}
            onCancel={() => setShowDeleteConfirm(false)}
            isDestructive={true}
        />
    </>
  );
};