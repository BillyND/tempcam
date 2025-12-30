/**
 * Camera Permission Management Service
 * Checks permission status before requesting to avoid repeated prompts
 */

const PERMISSION_STORAGE_KEY = 'camera_permission_status';

type PermissionStatus = 'granted' | 'denied' | 'prompt';

interface PermissionState {
  status: PermissionStatus;
  lastChecked: number;
}

/**
 * Check camera permission status using Permissions API
 * Falls back to requesting if API not available
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  try {
    // Check if Permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      // Type assertion needed as 'camera' might not be in PermissionName enum in some TS versions
      const result = await navigator.permissions.query({ 
        name: 'camera' as PermissionName 
      });
      const status = result.state as PermissionStatus;
      
      // Listen for permission changes and update cache
      result.onchange = () => {
        const newStatus = result.state as PermissionStatus;
        savePermissionStatus(newStatus);
      };
      
      return status;
    }
  } catch (error) {
    console.log("===> Permissions API not available, will check cache", error);
  }
  
  // Fallback: check localStorage for cached status
  const cached = getCachedPermissionStatus();
  if (cached) {
    return cached.status;
  }
  
  // Default to prompt if we can't check
  return 'prompt';
}

/**
 * Get cached permission status from localStorage
 */
function getCachedPermissionStatus(): PermissionState | null {
  try {
    const stored = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (stored) {
      const state: PermissionState = JSON.parse(stored);
      // Cache is valid for 1 hour
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - state.lastChecked < oneHour) {
        return state;
      }
    }
  } catch (error) {
    console.log("===> Error reading cached permission", error);
  }
  return null;
}

/**
 * Save permission status to localStorage
 */
function savePermissionStatus(status: PermissionStatus): void {
  try {
    const state: PermissionState = {
      status,
      lastChecked: Date.now()
    };
    localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.log("===> Error saving permission status", error);
  }
}

/**
 * Request camera access with permission checking
 * Only requests if permission is not already granted
 */
export async function requestCameraAccess(
  constraints: MediaStreamConstraints
): Promise<MediaStream> {
  // Check current permission status
  const currentStatus = await checkCameraPermission();
  
  console.log("===> Camera permission status:", currentStatus);
  
  // If already granted, request directly
  if (currentStatus === 'granted') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      savePermissionStatus('granted');
      return stream;
    } catch (error) {
      console.error("===> Error accessing camera (permission granted but failed)", error);
      // Permission might have been revoked, update status
      savePermissionStatus('denied');
      throw error;
    }
  }
  
  // If denied, throw error immediately
  if (currentStatus === 'denied') {
    savePermissionStatus('denied');
    const error = new Error('Quyền truy cập camera đã bị từ chối. Vui lòng bật quyền camera trong cài đặt trình duyệt.');
    (error as any).name = 'PermissionDeniedError';
    throw error;
  }
  
  // If prompt or unknown, request permission
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    savePermissionStatus('granted');
    return stream;
  } catch (error: any) {
    // Determine if error is due to permission denial
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      savePermissionStatus('denied');
    }
    throw error;
  }
}

/**
 * Clear cached permission status (useful for testing or reset)
 */
export function clearPermissionCache(): void {
  try {
    localStorage.removeItem(PERMISSION_STORAGE_KEY);
  } catch (error) {
    console.log("===> Error clearing permission cache", error);
  }
}

