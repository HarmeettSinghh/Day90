/**
 * IndexedDB helper for on-device photo storage.
 * Photos NEVER leave the device or go to the server.
 */

const DB_NAME = 'day90_photos';
const DB_VERSION = 1;
const STORE_NAME = 'weekly_photos';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('routineId', 'routineId', { unique: false });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save a photo for a specific routine + week.
 * @param {string} routineId
 * @param {number} weekNumber
 * @param {string} dataUrl - base64 image data URL
 */
export async function savePhoto(routineId, weekNumber, dataUrl) {
  const db = await openDB();
  const key = `${routineId}_week_${weekNumber}`;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ key, routineId, weekNumber, dataUrl, savedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve(key);
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Get a photo by routine + week.
 */
export async function getPhoto(routineId, weekNumber) {
  const db = await openDB();
  const key = `${routineId}_week_${weekNumber}`;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = (e) => resolve(e.target.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Get all photos for a routine.
 */
export async function getPhotosForRoutine(routineId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('routineId');
    const req = index.getAll(routineId);
    req.onsuccess = (e) => resolve(e.target.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Delete all photos for a routine (used in account deletion flow).
 */
export async function deleteAllPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}
