/**
 * IndexedDB storage utility for SlopGuard
 */
(function() {
  const DB_NAME = SlopGuardConfig.INDEXEDDB_NAME;
  const STORE_NAME = SlopGuardConfig.INDEXEDDB_STORE_NAME;
  const VERSION = SlopGuardConfig.INDEXEDDB_VERSION;
  let dbPromise;

  function initDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, VERSION);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
          }
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'videoId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        };
        request.onsuccess = () => resolve(request.result);
      });
    }
    return dbPromise;
  }

  async function withStore(mode, fn) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], mode);
      const store = tx.objectStore(STORE_NAME);
      let res;
      try { res = fn(store, tx); } catch (e) { reject(e); return; }
      tx.oncomplete = () => resolve(res);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function saveBlob(videoId, blob, metadata = {}) {
    const record = {
      videoId,
      blob,
      timestamp: Date.now(),
      sourceUrl: metadata.sourceUrl || null,
      fileSize: metadata.fileSize || (blob && blob.size) || 0
    };
    return withStore('readwrite', store => {
      store.add(record);
    });
  }

  async function getBlob(videoId) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteBlob(videoId) {
    return withStore('readwrite', store => store.delete(videoId));
  }

  async function cleanupOldBlobs(count) {
    if (count <= 0) return;
    return withStore('readwrite', store => {
      const idx = store.index('timestamp');
      let deleted = 0;
      idx.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor || deleted >= count) return;
        store.delete(cursor.primaryKey);
        deleted++;
        cursor.continue();
      };
    });
  }

  async function getStorageUsage() {
    const db = await initDB();
    const all = await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    let total = 0;
    (all || []).forEach(r => { if (r.fileSize) total += r.fileSize; else if (r.blob && r.blob.size) total += r.blob.size; });
    return { count: all.length, bytes: total };
  }

  const api = { initDB, saveBlob, getBlob, deleteBlob, cleanupOldBlobs, getStorageUsage };
  try { window.SlopGuardStorage = api; } catch(_) {}
})();