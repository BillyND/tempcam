import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MediaItem } from "../../types";
import { dbService } from "../../services/db";
import { Play, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { MediaViewer } from "./MediaViewer";

interface GalleryScreenProps {
  onBack: () => void;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({ onBack }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await dbService.getMedia();
      setItems(data);
    } catch (e) {
      console.error("Failed to load media", e);
      toast.error("Lỗi tải thư viện");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dbService.deleteMedia(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Đã xóa", {
        duration: 2000,
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    } catch (e) {
      console.error("Delete failed", e);
      toast.error("Không thể xóa. Vui lòng thử lại.");
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-black" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-gray-800 bg-black/90 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center text-blue-500 font-medium"
        >
          <ChevronLeft size={24} />
          Camera
        </button>
        <h1 className="flex-1 text-center font-bold text-white pr-8">
          Thư viện
        </h1>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-1" style={{ minHeight: 0 }}>
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
            <ImageIcon size={48} className="opacity-50" />
            <p>Chưa có ảnh hoặc video nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className="relative aspect-square bg-gray-900 cursor-pointer overflow-hidden"
              >
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700">
                    <ImageIcon />
                  </div>
                )}

                {item.type === "video" && (
                  <div className="absolute bottom-1 right-1 text-[10px] font-bold text-white flex items-center gap-1 drop-shadow-md">
                    <Play size={10} fill="currentColor" />
                    {formatDuration(item.duration)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Viewer Overlay */}
      {selected && (
        <MediaViewer
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
