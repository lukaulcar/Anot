const DB_NAME = 'AnnotateAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'session_store';
const KEY = 'active_project';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSessionState(state) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const dataToSave = {
        ...state,
        savedAt: Date.now(),
      };
      const req = store.put(dataToSave, KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // IDB can fail in private mode — localStorage is fine as a backup.
    console.warn('IDB save failed, using localStorage:', err);
    try {
      localStorage.setItem('annotate_backup_state', JSON.stringify({
        ...state,
        savedAt: Date.now(),
      }));
      return true;
    } catch (lsErr) {
      console.error('Failed to save to localStorage as well:', lsErr);
      return false;
    }
  }
}

export async function loadSessionState() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result);
        } else {
          resolve(loadFromLocalStorage());
        }
      };
      req.onerror = () => {
        resolve(loadFromLocalStorage());
      };
    });
  } catch (err) {
    console.warn('IDB load failed, using localStorage:', err);
    return loadFromLocalStorage();
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('annotate_backup_state');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading localStorage backup:', e);
    return null;
  }
}

export async function clearSessionState() {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }

  try {
    localStorage.removeItem('annotate_backup_state');
  } catch {
    // ignore — storage just isn't available here
  }
}
