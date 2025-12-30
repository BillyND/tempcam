import React from 'react';
import { Zap, ZapOff, Settings, ChevronLeft } from 'lucide-react';
import { AppSettings } from '../../types';

interface TopBarProps {
  hasFlash: boolean;
  flashEnabled: boolean;
  onToggleFlash: () => void;
  onOpenSettings: () => void;
  recordingTime: number; // 0 if not recording
}

export const TopBar: React.FC<TopBarProps> = ({ 
  hasFlash, 
  flashEnabled, 
  onToggleFlash, 
  onOpenSettings,
  recordingTime
}) => {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent z-20 flex items-center justify-between px-4">
      {/* Settings Button */}
      {!recordingTime ? (
          <button onClick={onOpenSettings} className="p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors">
            <Settings size={24} />
          </button>
      ) : <div className="w-10" />}

      {/* Center status: Timer or Logo */}
      <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm border border-white/10">
          {recordingTime > 0 ? (
              <span className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                {formatTime(recordingTime)}
              </span>
          ) : (
              <span className="text-white/80 tracking-widest text-xs">TEMPCAM</span>
          )}
      </div>

      {/* Flash Button */}
      {!recordingTime ? (
        <button 
            onClick={onToggleFlash} 
            disabled={!hasFlash}
            className={`p-2 rounded-full transition-all ${flashEnabled ? 'text-yellow-400 bg-yellow-400/20' : 'text-white/90 hover:bg-white/10'} ${!hasFlash ? 'opacity-30' : ''}`}
        >
            {flashEnabled ? <Zap size={24} fill="currentColor" /> : <ZapOff size={24} />}
        </button>
      ) : <div className="w-10" />}
    </div>
  );
};
