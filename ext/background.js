/**
 * SlopGuard Background Script
 * Handles background tasks and messaging between components
 */

// Background delegates to storage.js; no separate DB init needed
let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SlopGuardConfig.INDEXEDDB_NAME, SlopGuardConfig.INDEXEDDB_VERSION);
    
    request.onerror = () => {
      SlopGuardConfig.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      db = request.result;
      SlopGuardConfig.log('IndexedDB initialized successfully');
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const storeName = SlopGuardConfig.INDEXEDDB_STORE_NAME;
      if (db.objectStoreNames.contains(storeName)) {
        db.deleteObjectStore(storeName);
      }
      const objectStore = db.createObjectStore(storeName, { keyPath: 'videoId' });
      objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      SlopGuardConfig.log('Object store created/updated');
    };
  });
}

// Initialize on extension load
try { SlopGuardStorage.initDB && SlopGuardStorage.initDB(); } catch(_) {}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  SlopGuardConfig.log('Message received:', request.type);
  
  if (request.type === 'STORE_VIDEO') {
    storeVideo(request.data)
      .then(id => sendResponse({ success: true, id }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'OPEN_UPLOAD') {
    try {
      const url = SlopGuardConfig.getFullUploadUrl(request.videoId);
      chrome.tabs.create({ url });
      sendResponse({ success: true });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return true;
  }
  if (request.type === 'GET_VIDEOS') {
    (async () => {
      try {
        const db = await SlopGuardStorage.initDB();
        const all = await new Promise((resolve, reject) => {
          const tx = db.transaction([SlopGuardConfig.INDEXEDDB_STORE_NAME], 'readonly');
          const store = tx.objectStore(SlopGuardConfig.INDEXEDDB_STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
        sendResponse({ success: true, videos: all });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }
  
  if (request.type === 'DELETE_VIDEO') {
    SlopGuardStorage.deleteBlob(request.id)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Store video in IndexedDB (unused legacy) 
function storeVideo(videoData) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([SlopGuardConfig.INDEXEDDB_STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(SlopGuardConfig.INDEXEDDB_STORE_NAME);
    const data = { ...videoData, timestamp: Date.now() };
    const request = objectStore.add(data);
    request.onsuccess = () => {
      SlopGuardConfig.log('Video stored');
      resolve(true);
    };
    
    request.onerror = () => {
      SlopGuardConfig.error('Failed to store video:', request.error);
      reject(request.error);
    };
  });
}

// Get all stored videos
function getStoredVideos() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([SlopGuardConfig.INDEXEDDB_STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(SlopGuardConfig.INDEXEDDB_STORE_NAME);
    const request = objectStore.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Delete video from IndexedDB
function deleteVideo(id) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([SlopGuardConfig.INDEXEDDB_STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(SlopGuardConfig.INDEXEDDB_STORE_NAME);
    const request = objectStore.delete(id);
    
    request.onsuccess = () => {
      SlopGuardConfig.log('Video deleted:', id);
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

SlopGuardConfig.log('Background script loaded');
