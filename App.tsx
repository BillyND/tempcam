import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { ViewState, AppSettings } from './types';
import { dbService } from './services/db';
import { CameraScreen } from './components/camera/CameraScreen';
import { GalleryScreen } from './components/gallery/GalleryScreen';
import { SettingsView } from './components/SettingsView';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('camera');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await dbService.init();
        const storedSettings = await dbService.getSettings();
        setSettings(storedSettings);
        setIsDbReady(true);
        
        await dbService.cleanupExpired();
        
        // Auto cleanup every minute
        const interval = setInterval(() => dbService.cleanupExpired(), 60000);
        return () => clearInterval(interval);

      } catch (error) {
        console.error("Initialization failed", error);
        toast.error("Lỗi khởi tạo ứng dụng");
      }
    };
    init();
  }, []);

  const updateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await dbService.saveSettings(newSettings);
    toast.success("Đã lưu cài đặt", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
        iconTheme: { primary: '#3b82f6', secondary: '#FFFAEE' },
    });
  };

  const handleClearAll = async () => {
      const items = await dbService.getMedia();
      for (const item of items) {
          await dbService.deleteMedia(item.id);
      }
      toast.success("Đã xóa tất cả dữ liệu", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
  };

  if (!isDbReady || !settings) {
    return <div className="h-screen w-screen bg-black" />;
  }

  // Router logic without bottom nav
  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
        <Toaster position="top-center" />
        
        {view === 'camera' && (
            <CameraScreen 
                settings={settings} 
                onNavigate={(v) => setView(v)} 
            />
        )}
        
        {view === 'gallery' && (
            <GalleryScreen onBack={() => setView('camera')} />
        )}
        
        {view === 'settings' && (
            <SettingsView 
                settings={settings} 
                onUpdateSettings={updateSettings} 
                onClearAll={handleClearAll}
                onBack={() => setView('camera')}
            />
        )}
    </div>
  );
};

export default App;