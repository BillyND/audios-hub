// src/libs/indexedDBHelpers.ts

import toast from "react-hot-toast";

interface DBConfig {
  dbName: string;
  storeNames: string[];
  dbVersion?: number;
}

export interface RecordingItem {
  id: string;
  audioUrl: string;
  audioBinary: ArrayBuffer;
  timestamp: number;
  text: string;
}

export interface TTSHistoryItem {
  id: string;
  text: string;
  audioUrl: string;
  audioBinary: ArrayBuffer;
  timestamp: number;
}

export interface TTSSettings {
  id: number;
  language: string;
  speed: number;
  text: string;
  isOptimizeWithAI: boolean;
  voice: string;
}

export interface LanguageOption {
  code: string;
  name: string;
}

export const initDB = (config: DBConfig): Promise<IDBDatabase> => {
  const { dbName, storeNames, dbVersion = 1 } = config;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
      console.error(
        "Error opening IndexedDB",
        (event.target as IDBOpenDBRequest).error
      );
      toast.error("Unable to access database");
      reject(new Error("Failed to open database"));
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      storeNames.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      });
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

export const addItem = async <T>(
  config: DBConfig,
  storeName: string,
  item: T
): Promise<void> => {
  try {
    const db = await initDB(config);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Error adding item to ${storeName}:`, event);
        reject(new Error(`Failed to add item to ${storeName}`));
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Error adding item to ${storeName}:`, error);
    throw error;
  }
};

export const deleteItem = async (
  config: DBConfig,
  storeName: string,
  id: string
): Promise<void> => {
  try {
    const db = await initDB(config);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Error deleting item from ${storeName}:`, event);
        toast.error(`Failed to delete item from ${storeName}`);
        reject(new Error(`Failed to delete item from ${storeName}`));
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Error deleting item from ${storeName}:`, error);
    throw error;
  }
};

export const loadItems = async <T>(
  config: DBConfig,
  storeName: string,
  indexName?: string // Make indexName optional
): Promise<T[]> => {
  try {
    const db = await initDB(config);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);

      let request;

      // Check if we need to use an index and if it exists
      if (indexName && Array.from(store.indexNames).includes(indexName)) {
        const index = store.index(indexName);
        request = index.getAll();
      } else {
        // Fall back to getting all items from the store
        request = store.getAll();
      }

      request.onsuccess = () => {
        const items = request.result as T[];
        resolve(items);
      };

      request.onerror = (event) => {
        console.error(`Error loading items from ${storeName}:`, event);
        toast.error(`Failed to load items from ${storeName}`);
        reject(new Error(`Failed to load items from ${storeName}`));
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Error loading items from ${storeName}:`, error);
    throw error;
  }
};

export const clearStore = async (
  config: DBConfig,
  storeName: string,
  showSuccessToast: boolean = true
): Promise<void> => {
  try {
    const db = await initDB(config);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      const request = store.clear();

      request.onsuccess = () => {
        if (showSuccessToast) {
          toast.success(`All items in ${storeName} cleared`);
        }
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Error clearing store ${storeName}:`, event);
        toast.error(`Failed to clear store ${storeName}`);
        reject(new Error(`Failed to clear store ${storeName}`));
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Error clearing store ${storeName}:`, error);
    throw error;
  }
};
