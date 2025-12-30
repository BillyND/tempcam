export type MediaType = 'video' | 'photo';

export interface MediaItem {
  id: string;
  type: MediaType;
  blob: Blob;
  mimeType: string; // Added to reconstruction Blob from ArrayBuffer on iOS
  thumbnailUrl?: string; // Data URL for display
  duration: number; // in seconds (0 for photo)
  size: number; // in bytes
  createdAt: number;
  expiryDate: number;
  resolution: string;
  width?: number;
  height?: number;
}

export interface AppSettings {
  resolution: ResolutionPreset;
  defaultRetentionHours: number;
}

export type ResolutionPreset = '4k' | '1080p' | '720p' | '480p';

export const RESOLUTIONS: Record<ResolutionPreset, { label: string, width: number, height: number }> = {
  '4k': { label: '4K', width: 3840, height: 2160 },
  '1080p': { label: '1080p', width: 1920, height: 1080 },
  '720p': { label: '720p', width: 1280, height: 720 },
  '480p': { label: '480p', width: 854, height: 480 },
};

export type ViewState = 'camera' | 'gallery' | 'settings';
export type CameraMode = 'PHOTO' | 'VIDEO';
export type FlashMode = 'off' | 'on' | 'auto'; // Auto is usually hard on web, but we can keep the state