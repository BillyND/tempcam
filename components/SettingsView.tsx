import React, { useState } from 'react';
import { AppSettings, ResolutionPreset, RESOLUTIONS } from '../types';
import { Check, Trash2, ChevronLeft } from 'lucide-react';
import { ConfirmModal } from './ui/ConfirmModal';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearAll: () => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, onClearAll, onBack }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const handleResolutionChange = (res: ResolutionPreset) => {
    onUpdateSettings({ ...settings, resolution: res });
  };

  const handleRetentionChange = (hours: number) => {
    onUpdateSettings({ ...settings, defaultRetentionHours: hours });
  };

  return (
    <div className="flex flex-col h-full bg-black text-white" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-gray-800 bg-black/90">
        <button onClick={onBack} className="flex items-center text-blue-500 font-medium">
            <ChevronLeft size={24} />
            Camera
        </button>
        <h1 className="flex-1 text-center font-bold pr-8">Cài đặt</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ minHeight: 0 }}>
        {/* Resolution */}
        <section>
            <h2 className="text-xs uppercase text-gray-500 font-bold mb-2 ml-2">Độ phân giải</h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden divide-y divide-gray-800">
                {(Object.keys(RESOLUTIONS) as ResolutionPreset[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => handleResolutionChange(key)}
                        className="w-full flex items-center justify-between p-3 active:bg-gray-800"
                    >
                        <span className="text-sm">{RESOLUTIONS[key].label}</span>
                        {settings.resolution === key && <Check className="text-blue-500" size={18} />}
                    </button>
                ))}
            </div>
        </section>

        {/* Retention */}
        <section>
            <h2 className="text-xs uppercase text-gray-500 font-bold mb-2 ml-2">Tự hủy sau</h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden divide-y divide-gray-800">
                {[1, 12, 24, 72].map((val) => (
                    <button
                        key={val}
                        onClick={() => handleRetentionChange(val)}
                        className="w-full flex items-center justify-between p-3 active:bg-gray-800"
                    >
                        <span className="text-sm">{val} Giờ</span>
                        {settings.defaultRetentionHours === val && <Check className="text-blue-500" size={18} />}
                    </button>
                ))}
            </div>
        </section>

        {/* Danger */}
        <section className="pt-8">
            <button 
                onClick={() => setShowClearConfirm(true)}
                className="w-full bg-red-500/10 text-red-500 p-3 rounded-lg flex items-center justify-center gap-2 font-medium active:bg-red-500/20 transition-colors"
            >
                <Trash2 size={18} />
                Xóa sạch dữ liệu
            </button>
        </section>
        
        <p className="text-center text-gray-600 text-[10px]">TempCam v1.1.0 (iPhone Style)</p>
      </div>

      <ConfirmModal 
        isOpen={showClearConfirm}
        title="Xóa tất cả dữ liệu?"
        message="Hành động này không thể hoàn tác. Tất cả ảnh và video đã lưu sẽ bị xóa vĩnh viễn khỏi thiết bị."
        onConfirm={() => {
            onClearAll();
            setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
        isDestructive={true}
        confirmLabel="Xóa ngay"
      />
    </div>
  );
};