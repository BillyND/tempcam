import { useState, useEffect, useRef, useCallback } from 'react';
import { AppSettings, RESOLUTIONS } from '../types';
import { requestCameraAccess } from '../services/permissions';

export const useCamera = (settings: AppSettings) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [flash, setFlash] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Restart camera when resolution or facing mode changes
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [settings.resolution, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsReady(false);
  };

  const startCamera = async () => {
    stopCamera();
    try {
      const resConfig = RESOLUTIONS[settings.resolution];
      const constraints: MediaStreamConstraints = {
        audio: true, // Always ask for audio so video recording works smoothly
        video: {
          facingMode: facingMode,
          width: { ideal: resConfig.width },
          height: { ideal: resConfig.height },
        }
      };

      // Use permission-aware request function
      const stream = await requestCameraAccess(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check capabilities
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      
      // Zoom
      if ((capabilities as any).zoom) {
        // @ts-ignore
        setMaxZoom((capabilities as any).zoom.max || 3);
      } else {
        setMaxZoom(3); // Digital zoom limit
      }

      // Flash/Torch
      // @ts-ignore
      setHasFlash(!!capabilities.torch);

      setError(null);
      
      // Small delay to ensure video element is playing
      videoRef.current?.play().catch(e => console.log("Play error", e));
      setIsReady(true);

    } catch (err) {
      console.error("Camera error:", err);
      setError("Không thể truy cập camera. Hãy kiểm tra quyền truy cập.");
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setZoom(1); // Reset zoom on flip
  };

  const setZoomLevel = async (level: number) => {
    setZoom(level);
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && track.getCapabilities && (track.getCapabilities() as any).zoom) {
      try {
        await track.applyConstraints({ advanced: [{ zoom: level }] } as any);
      } catch (e) {
        console.warn("Native zoom failed, using digital fallback");
      }
    }
  };

  const toggleFlash = async () => {
    if (!hasFlash) return;
    const newFlashState = !flash;
    setFlash(newFlashState);
    
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      try {
        await track.applyConstraints({ advanced: [{ torch: newFlashState }] } as any);
      } catch (e) {
        console.error("Flash toggle failed", e);
      }
    }
  };

  const takePhoto = async (): Promise<Blob | null> => {
    if (!videoRef.current) return null;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Flip horizontally if user facing
    if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  };

  return {
    videoRef,
    stream: streamRef.current,
    error,
    isReady,
    facingMode,
    toggleFacingMode,
    zoom,
    maxZoom,
    setZoomLevel,
    flash,
    hasFlash,
    toggleFlash,
    takePhoto
  };
};