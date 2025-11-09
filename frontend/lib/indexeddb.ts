/**
 * IndexedDB utility for retrieving videos stored by the Chrome Extension
 */

const DB_CONFIG = {
  name: 'SlopGuardVideos',
  storeName: 'pendingUploads',
  version: 2,
} as const;

export interface VideoRecord {
  videoId: string;
  blob: Blob;
  timestamp: number;
  sourceUrl: string;
  fileSize: number;
}

/**
 * Initialize IndexedDB connection
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB: ' + request.error));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    // This shouldn't trigger since DB is already created by extension
    // But included for safety
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
        const store = db.createObjectStore(DB_CONFIG.storeName, { keyPath: 'videoId' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Retrieve video blob and metadata from IndexedDB
 */
export async function getBlobFromStorage(videoId: string): Promise<VideoRecord> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_CONFIG.storeName], 'readonly');
    const store = transaction.objectStore(DB_CONFIG.storeName);
    const request = store.get(videoId);

    request.onsuccess = () => {
      const result = request.result;

      if (!result) {
        reject(new Error('Video not found in storage'));
        return;
      }

      resolve(result);
    };

    request.onerror = () => {
      reject(new Error('Failed to retrieve video: ' + request.error));
    };
  });
}

/**
 * Delete video from IndexedDB after successful upload
 */
export async function deleteBlobFromStorage(videoId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_CONFIG.storeName], 'readwrite');
    const store = transaction.objectStore(DB_CONFIG.storeName);
    const request = store.delete(videoId);

    request.onsuccess = () => {
      console.log('Video deleted from local storage');
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete video: ' + request.error));
    };
  });
}

/**
 * Get videoId from URL query parameters
 */
export function getVideoIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('videoId');
}
