import { openDB } from 'idb';

export const initDB = async () => {
  return openDB('churbo', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('problems')) {
        db.createObjectStore('problems', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('code')) {
        db.createObjectStore('code', { keyPath: 'id' });
      }
    },
  });
};