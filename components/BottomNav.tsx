import React from 'react';
import { Camera, Grid, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const navItemClass = (view: ViewState) => `
    flex flex-col items-center justify-center w-full h-full space-y-1
    ${currentView === view ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
    transition-colors duration-200
  `;

  return (
    <div className="h-20 bg-black border-t border-gray-800 flex justify-around items-center px-2 pb-2">
      <button onClick={() => onChangeView('camera')} className={navItemClass('camera')}>
        <Camera size={24} strokeWidth={currentView === 'camera' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Quay</span>
      </button>
      
      <button onClick={() => onChangeView('gallery')} className={navItemClass('gallery')}>
        <Grid size={24} strokeWidth={currentView === 'gallery' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Thư viện</span>
      </button>
      
      <button onClick={() => onChangeView('settings')} className={navItemClass('settings')}>
        <Settings size={24} strokeWidth={currentView === 'settings' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Cài đặt</span>
      </button>
    </div>
  );
};