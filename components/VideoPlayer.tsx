import React, { useMemo } from 'react';
import { X, Download, Trash2, Clock, Calendar } from 'lucide-react';
import { MediaItem } from '../types';

interface VideoPlayerProps {
  video: MediaItem | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose, onDelete }) => {
  if (!video) return null;

  const videoUrl = useMemo(() => URL.createObjectURL(video.blob), [video.blob]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `tempcam-${new Date(video.createdAt).toISOString()}.mp4`; // Assuming mp4/webm container
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc chắn muốn xóa video này không?')) {
        onDelete(video.id);
        onClose();
    }
  };

  const timeLeft = Math.max(0, video.expiryDate - Date.now());
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10 backdrop-blur-sm">
         <div className="flex flex-col">
            <span className="text-sm font-medium text-white/90">
                {new Date(video.createdAt).toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-red-400 flex items-center gap-1">
                <Clock size={12} /> Tự hủy sau: {hoursLeft}h {minsLeft}p
            </span>
         </div>
         <button onClick={onClose} className="p-2 bg-gray-800/80 rounded-full text-white hover:bg-gray-700">
            <X size={24} />
         </button>
      </div>

      {/* Player */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <video 
            src={videoUrl} 
            controls 
            autoPlay 
            className="max-h-full max-w-full w-full object-contain"
            playsInline
        />
      </div>

      {/* Actions */}
      <div className="p-6 bg-gray-900 pb-12 flex justify-around items-center gap-4">
        <button 
            onClick={handleDownload}
            className="flex flex-col items-center gap-1 text-white hover:text-blue-400 active:scale-95 transition-transform"
        >
            <div className="p-3 bg-gray-800 rounded-full mb-1">
                <Download size={24} />
            </div>
            <span className="text-xs">Tải về</span>
        </button>

        <button 
            onClick={handleDelete}
            className="flex flex-col items-center gap-1 text-red-500 hover:text-red-400 active:scale-95 transition-transform"
        >
            <div className="p-3 bg-gray-800 rounded-full mb-1">
                <Trash2 size={24} />
            </div>
            <span className="text-xs">Xóa ngay</span>
        </button>
      </div>
    </div>
  );
};