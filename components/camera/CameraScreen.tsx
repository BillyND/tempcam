import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, CameraMode, MediaItem } from '../../types';
import { useCamera } from '../../hooks/useCamera';
import { dbService } from '../../services/db';
import { TopBar } from './TopBar';
import { CameraControls } from './CameraControls';

interface CameraScreenProps {
  settings: AppSettings;
  onNavigate: (view: 'gallery' | 'settings') => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ settings, onNavigate }) => {
  const [mode, setMode] = useState<CameraMode>('VIDEO');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lastMedia, setLastMedia] = useState<MediaItem | null>(null);

  const { 
    videoRef, stream, error, isReady, 
    facingMode, toggleFacingMode,
    zoom, setZoomLevel,
    flash, hasFlash, toggleFlash,
    takePhoto
  } = useCamera(settings);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Load last media for thumbnail
  useEffect(() => {
    dbService.getMedia().then(items => {
        if (items.length > 0) setLastMedia(items[0]);
    });
  }, [isRecording]); // Refresh when recording stops

  const generatePhotoThumbnail = async (blob: Blob): Promise<string> => {
    // Convert photo blob to data URL for persistent thumbnail
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Create a smaller thumbnail version
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 320;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            resolve(result); // Fallback to original if canvas fails
          }
        };
        img.onerror = () => resolve(result); // Fallback to original
        img.src = result;
      };
      reader.onerror = () => resolve(''); // Empty string on error
      reader.readAsDataURL(blob);
    });
  };

  const handleCapture = async () => {
    if (mode === 'PHOTO') {
        // Flash effect
        const flashOverlay = document.getElementById('flash-overlay');
        if (flashOverlay) {
            flashOverlay.style.opacity = '1';
            setTimeout(() => flashOverlay.style.opacity = '0', 100);
        }

        const blob = await takePhoto();
        if (blob) {
            const thumb = await generatePhotoThumbnail(blob); // Data URL instead of blob URL
            const item: MediaItem = {
                id: crypto.randomUUID(),
                type: 'photo',
                blob,
                mimeType: 'image/jpeg',
                thumbnailUrl: thumb,
                duration: 0,
                size: blob.size,
                createdAt: Date.now(),
                expiryDate: Date.now() + (settings.defaultRetentionHours * 3600000),
                resolution: settings.resolution
            };
            await dbService.saveMedia(item);
            setLastMedia(item);
        }
    } else {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    // Prioritize mp4/h264 for compatibility if possible, else webm
    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    
    try {
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const thumb = await generateVideoThumbnail(blob);
            
            const item: MediaItem = {
                id: crypto.randomUUID(),
                type: 'video',
                blob,
                mimeType: mimeType,
                thumbnailUrl: thumb,
                duration: recordingTime,
                size: blob.size,
                createdAt: Date.now(),
                expiryDate: Date.now() + (settings.defaultRetentionHours * 3600000),
                resolution: settings.resolution
            };
            await dbService.saveMedia(item);
            setLastMedia(item);
            setRecordingTime(0);
        };

        recorder.start(1000);
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (e) {
        console.error("Recording failed", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (timerRef.current) window.clearInterval(timerRef.current);
    }
  };

  const generateVideoThumbnail = async (blob: Blob): Promise<string> => {
      // Helper to generate thumb from video blob
      const url = URL.createObjectURL(blob);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5;
      await new Promise(r => video.onseeked = r);
      
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      return canvas.toDataURL('image/jpeg', 0.7);
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col" style={{ height: '100dvh' }}>
       {/* Flash Overlay */}
       <div id="flash-overlay" className="absolute inset-0 bg-white opacity-0 pointer-events-none z-50 transition-opacity duration-100" />

       {/* Top Bar */}
       <TopBar 
          hasFlash={hasFlash}
          flashEnabled={flash}
          onToggleFlash={toggleFlash}
          onOpenSettings={() => onNavigate('settings')}
          recordingTime={isRecording ? recordingTime : 0}
       />

       {/* Viewport */}
       <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center" style={{ minHeight: 0 }}>
          {error && (
            <div className="text-white text-center p-4">
                <p className="mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-800 rounded">Reload</button>
            </div>
          )}
          
          <video 
             ref={videoRef}
             autoPlay 
             playsInline 
             muted 
             className={`w-full h-full object-cover transition-transform duration-300 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
             style={{ 
                 // Use CSS zoom for digital zoom feel if constraint not applied
                 transform: `scale(${zoom}) ${facingMode === 'user' ? 'scaleX(-1)' : ''}` 
             }}
          />
       </div>

       {/* Controls */}
       <CameraControls 
          mode={mode}
          setMode={setMode}
          isRecording={isRecording}
          onCapture={handleCapture}
          onFlip={toggleFacingMode}
          onGallery={() => onNavigate('gallery')}
          zoom={zoom}
          setZoom={setZoomLevel}
          lastThumb={lastMedia?.thumbnailUrl}
       />
    </div>
  );
};