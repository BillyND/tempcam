import { MediaItem, AppSettings } from "../types";

const DB_NAME = "TempCamDB";
const DB_VERSION = 3; // Version 3: Migrating to ArrayBuffer storage for iOS compatibility
const STORE_MEDIA = "media";
const STORE_SETTINGS = "settings";

export class DBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event);
        reject("Could not open database");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Remove old stores if they exist to prevent schema conflicts during dev
        if (db.objectStoreNames.contains("videos")) {
          db.deleteObjectStore("videos");
        }

        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          db.createObjectStore(STORE_MEDIA, { keyPath: "id" });
        }

        // If updating from V2 to V3, we technically keep the store but the data format changes.
        // For simplicity in this context, we are keeping the same store.

        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
        }
      };
    });
  }

  // --- Media ---

  async saveMedia(item: MediaItem): Promise<void> {
    // IOS FIX: Convert Blob to ArrayBuffer before storing
    if (!item.blob) {
      console.error("===> Cannot save media: blob is missing", item);
      throw new Error("MediaItem must have a valid blob");
    }

    const arrayBuffer = await item.blob.arrayBuffer();

    // Create a clean object without blob, only store buffer
    const storedItem: any = {
      id: item.id,
      type: item.type,
      mimeType:
        item.mimeType || (item.type === "video" ? "video/mp4" : "image/jpeg"),
      thumbnailUrl: item.thumbnailUrl,
      duration: item.duration,
      size: item.size,
      createdAt: item.createdAt,
      expiryDate: item.expiryDate,
      resolution: item.resolution,
      width: item.width,
      height: item.height,
      buffer: arrayBuffer, // Store raw buffer instead of blob
    };

    return this.runTransaction(STORE_MEDIA, "readwrite", (store) => {
      store.put(storedItem); // Use put instead of add to allow updates
    });
  }

  async getMedia(): Promise<MediaItem[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      const transaction = this.db.transaction([STORE_MEDIA], "readonly");
      const store = transaction.objectStore(STORE_MEDIA);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawItems = request.result as any[];

        // Reconstruct Blob from ArrayBuffer with proper error handling
        const items: MediaItem[] = [];

        for (const item of rawItems) {
          try {
            let blob: Blob;

            // Priority: buffer (new format) > blob (old format, might be corrupted)
            if (item.buffer && item.buffer instanceof ArrayBuffer) {
              // New format: reconstruct from ArrayBuffer
              const mimeType =
                item.mimeType ||
                (item.type === "video" ? "video/mp4" : "image/jpeg");
              blob = new Blob([item.buffer], { type: mimeType });
            } else if (item.blob && item.blob instanceof Blob) {
              // Old format: use existing blob (might work on some browsers)
              blob = item.blob;
            } else {
              // Corrupted data: skip this item
              console.warn("===> Skipping corrupted media item:", item.id);
              continue;
            }

            // Validate required fields
            if (!item.id || !item.type || !item.createdAt || !item.expiryDate) {
              console.warn(
                "===> Skipping invalid media item (missing required fields):",
                item.id
              );
              continue;
            }

            items.push({
              id: item.id,
              type: item.type,
              blob: blob,
              mimeType:
                item.mimeType ||
                (item.type === "video" ? "video/mp4" : "image/jpeg"),
              thumbnailUrl: item.thumbnailUrl,
              duration: item.duration || 0,
              size: item.size || blob.size,
              createdAt: item.createdAt,
              expiryDate: item.expiryDate,
              resolution: item.resolution || "1080p",
              width: item.width,
              height: item.height,
            });
          } catch (error) {
            console.error(
              "===> Error reconstructing media item:",
              item.id,
              error
            );
            // Skip corrupted items instead of failing completely
          }
        }

        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMedia(id: string): Promise<void> {
    return this.runTransaction(STORE_MEDIA, "readwrite", (store) => {
      store.delete(id);
    });
  }

  async cleanupExpired(): Promise<number> {
    // Only fetch keys or metadata for performance in real app, but here we just get all
    const items = await this.getMedia();
    const now = Date.now();
    let deletedCount = 0;

    for (const item of items) {
      if (now > item.expiryDate) {
        await this.deleteMedia(item.id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  // --- Settings ---

  async getSettings(): Promise<AppSettings> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(this.getDefaultSettings());
        return;
      }
      const transaction = this.db.transaction([STORE_SETTINGS], "readonly");
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get("global");

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result as AppSettings);
        } else {
          resolve(this.getDefaultSettings());
        }
      };
      request.onerror = () => resolve(this.getDefaultSettings());
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    return this.runTransaction(STORE_SETTINGS, "readwrite", (store) => {
      store.put({ ...settings, key: "global" });
    });
  }

  private getDefaultSettings(): AppSettings {
    return {
      resolution: "1080p",
      defaultRetentionHours: 24,
    };
  }

  private runTransaction(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      callback(store);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const dbService = new DBService();
