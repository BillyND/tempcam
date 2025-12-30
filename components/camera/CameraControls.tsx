import React from 'react';
import { RefreshCw } from 'lucide-react';
import { CameraMode } from '../../types';

interface CameraControlsProps {
  mode: CameraMode;
  setMode: (mode: CameraMode) => void;
  isRecording: boolean;
  onCapture: () => void;
  onFlip: () => void;
  onGallery: () => void;
  zoom: number;
  setZoom: (z: number) => void;
  lastThumb?: string;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  mode,
  setMode,
  isRecording,
  onCapture,
  onFlip,
  onGallery,
  zoom,
  setZoom,
  lastThumb
}) => {
  const zoomLevels = [1, 2, 3];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-44 bg-black/40 backdrop-blur-sm z-20 flex flex-col justify-end pb-8">
      
      {/* Zoom Controls */}
      {!isRecording && (
        <div className="flex justify-center gap-4 mb-4">
            {zoomLevels.map(z => (
                <button
                    key={z}
                    onClick={() => setZoom(z)}
                    className={`
                        w-8 h-8 rounded-full text-xs font-bold border transition-all
                        ${zoom === z ? 'bg-yellow-500/90 text-black border-yellow-500 scale-110' : 'bg-black/50 text-white border-transparent hover:bg-gray-800'}
                    `}
                >
                    {z}x
                </button>
            ))}
        </div>
      )}

      {/* Mode Selector */}
      {!isRecording && (
        <div className="flex justify-center gap-8 mb-4 text-xs font-bold tracking-widest">
            <button 
                onClick={() => setMode('VIDEO')} 
                className={`transition-colors duration-300 ${mode === 'VIDEO' ? 'text-yellow-400' : 'text-gray-500'}`}
            >
                VIDEO
            </button>
            <button 
                onClick={() => setMode('PHOTO')} 
                className={`transition-colors duration-300 ${mode === 'PHOTO' ? 'text-yellow-400' : 'text-gray-500'}`}
            >
                PHOTO
            </button>
        </div>
      )}

      {/* Main Controls Row */}
      <div className="flex items-center justify-between px-8">
        
        {/* Gallery Preview */}
        {!isRecording ? (
            <button 
                onClick={onGallery}
                className="w-12 h-12 rounded-lg bg-gray-800 border-2 border-white/20 overflow-hidden active:scale-90 transition-transform"
            >
                {lastThumb ? (
                    <img src={lastThumb} alt="Gallery" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-900" />
                )}
            </button>
        ) : <div className="w-12" />}

        {/* Shutter Button */}
        <button 
            onClick={onCapture}
            className={`
                relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 active:scale-95
            `}
        >
            <div className={`
                rounded-full transition-all duration-300
                ${mode === 'VIDEO' 
                    ? (isRecording ? 'w-8 h-8 rounded-md bg-red-500' : 'w-16 h-16 bg-red-500') 
                    : 'w-16 h-16 bg-white'}
            `}></div>
        </button>

        {/* Flip Camera */}
        {!isRecording ? (
            <button 
                onClick={onFlip}
                className="w-12 h-12 rounded-full bg-gray-800/50 backdrop-blur-md flex items-center justify-center text-white active:scale-90 active:rotate-180 transition-all duration-500"
            >
                <RefreshCw size={24} />
            </button>
        ) : <div className="w-12" />}
      </div>
    </div>
  );
};
