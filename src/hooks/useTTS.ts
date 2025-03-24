import { v4 as uuidv4 } from "uuid";
import { Dispatch, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchTTSData } from "../api/newsApi";
import { LANGUAGES } from "../constants";

interface UseTTSResult {
  generateSpeech: (text: string, isOptimizeWithAI: boolean) => Promise<void>;
  audioUrl: string | null;
  history: TTSHistoryItem[];
  setHistory: Dispatch<React.SetStateAction<TTSHistoryItem[]>>;
  languages: LanguageOption[];
  isLoading: boolean;
  language: string;
  setLanguage: Dispatch<React.SetStateAction<string>>;
  speed: number;
  setSpeed: Dispatch<React.SetStateAction<number>>;
  text: string;
  setText: Dispatch<React.SetStateAction<string>>;
  isOptimizeWithAI: boolean;
  setIsOptimizeWithAI: Dispatch<React.SetStateAction<boolean>>;
  clearAllHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
}

interface TTSHistoryItem {
  id: string; // Changed type to string for UUID
  text: string;
  audioUrl: string;
  audioBinary: ArrayBuffer;
  timestamp: number;
}

interface TTSSettings {
  id: number; // Added id to ensure keyPath matches
  language: string;
  speed: number;
  text: string;
  isOptimizeWithAI: boolean;
}

interface LanguageOption {
  code: string;
  name: string;
}

// IndexedDB helper functions
const dbName = "ttsDatabase";
const historyStoreName = "ttsHistory";
const settingsStoreName = "ttsSettings";
const dbVersion = 1;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
      console.error(
        "Error opening IndexedDB",
        (event.target as IDBOpenDBRequest).error
      );
      reject(new Error("Failed to open database"));
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create ttsHistory object store with UUID as id
      if (!db.objectStoreNames.contains(historyStoreName)) {
        const historyStore = db.createObjectStore(historyStoreName, {
          keyPath: "id",
        });
        historyStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Create settings object store with a single record for all settings
      if (!db.objectStoreNames.contains(settingsStoreName)) {
        db.createObjectStore(settingsStoreName, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

// Function to save all settings at once
const saveSettings = async (settings: TTSSettings): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(settingsStoreName, "readwrite");
      const store = transaction.objectStore(settingsStoreName);

      // Always use ID 1 for settings to replace the same record
      const request = store.put(settings); // Pass the settings object directly

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to save settings"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};

// Function to load all settings at once
const loadSettings = async (): Promise<TTSSettings> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(settingsStoreName, "readonly");
      const store = transaction.objectStore(settingsStoreName);

      const request = store.get(1);

      request.onsuccess = () => {
        const defaultSettings: TTSSettings = {
          id: 1, // Ensure default also contains id
          language: "en",
          speed: 1,
          text: "",
          isOptimizeWithAI: false,
        };

        resolve(request.result ? request.result : defaultSettings);
      };

      request.onerror = () => reject(new Error("Failed to load settings"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error loading settings:", error);
    // Return default values if settings can't be loaded
    return {
      id: 1, // Ensure default also contains id
      language: "en",
      speed: 1,
      text: "",
      isOptimizeWithAI: false,
    };
  }
};

// Function to add a history item
const addHistoryItem = async (item: TTSHistoryItem): Promise<string> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(historyStoreName, "readwrite");
      const store = transaction.objectStore(historyStoreName);

      const request = store.add(item);

      request.onsuccess = () => {
        resolve(request.result as string);
      };

      request.onerror = () => reject(new Error("Failed to add history item"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error adding history item:", error);
    throw error;
  }
};

// Function to delete a specific history item by ID
const deleteHistoryItemFromDB = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(historyStoreName, "readwrite");
      const store = transaction.objectStore(historyStoreName);

      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to delete history item with ID ${id}`));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Error deleting history item with ID ${id}:`, error);
    throw error;
  }
};

// Function to load all history items
const loadHistory = async (): Promise<TTSHistoryItem[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(historyStoreName, "readonly");
      const store = transaction.objectStore(historyStoreName);
      const index = store.index("timestamp");

      const request = index.getAll();

      request.onsuccess = () => {
        const items = request.result as TTSHistoryItem[];
        // Create URLs for AudioBuffers and sort by timestamp (newest first)
        const processedItems = items
          .map((item) => ({
            ...item,
            audioUrl: URL.createObjectURL(new Blob([item.audioBinary])),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        resolve(processedItems);
      };

      request.onerror = () => reject(new Error("Failed to load history"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error loading history:", error);
    return [];
  }
};

// Function to clear all history
const clearHistory = async (): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(historyStoreName, "readwrite");
      const store = transaction.objectStore(historyStoreName);

      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear history"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error clearing history:", error);
    throw error;
  }
};

const useTTS = (): UseTTSResult => {
  const [language, setLanguage] = useState("en");
  const [speed, setSpeed] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<TTSHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [isOptimizeWithAI, setIsOptimizeWithAI] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the database and load initial data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load settings from IndexedDB
        const settings = await loadSettings();
        setLanguage(settings.language);
        setSpeed(settings.speed);
        setText(settings.text);
        setIsOptimizeWithAI(settings.isOptimizeWithAI);

        // Load history
        const historyItems = await loadHistory();
        setHistory(historyItems);

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize:", error);
        toast.error("Failed to load saved data");
        setIsInitialized(true); // Set to true anyway to not block the app
      }
    };

    initializeApp();

    // Clean up function to revoke object URLs when component unmounts
    return () => {
      history.forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save all settings whenever any of them change
  useEffect(() => {
    if (!isInitialized) return;

    const saveAllSettings = async () => {
      try {
        await saveSettings({
          id: 1, // Ensure id is provided in settings
          language,
          speed,
          text,
          isOptimizeWithAI,
        });
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    };

    saveAllSettings();
  }, [language, speed, text, isOptimizeWithAI, isInitialized]);

  const generateSpeech = async (text: string, isOptimizeWithAI: boolean) => {
    if (!text) {
      toast.error("Please enter some text!");
      return;
    }

    setIsLoading(true);
    setAudioUrl(null);
    try {
      const blob: Blob = await fetchTTSData(
        text,
        language,
        speed,
        isOptimizeWithAI
      );

      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const audioUrl = URL.createObjectURL(new Blob([arrayBuffer]));

        // Create history item with UUID
        const newItem: TTSHistoryItem = {
          id: uuidv4(),
          text,
          audioUrl,
          audioBinary: arrayBuffer,
          timestamp: Date.now(),
        };

        try {
          // Save to IndexedDB
          await addHistoryItem(newItem);

          // Update state
          setHistory((prevHistory) => [newItem, ...prevHistory]);
          setAudioUrl(audioUrl);
        } catch (error) {
          console.error("Failed to save history item:", error);
          toast.error("Generated speech but failed to save to history");
          // Still set the audio URL so it can be played
          setAudioUrl(audioUrl);
        }
      }
    } catch (error) {
      console.error("Error generating TTS:", error);
      toast.error("Failed to generate speech. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    if (!id) {
      console.error("Invalid ID provided for deletion");
      return;
    }

    try {
      // First find the item to get its URL for revocation
      const itemToDelete = history.find((item) => item.id === id);
      if (itemToDelete && itemToDelete.audioUrl) {
        URL.revokeObjectURL(itemToDelete.audioUrl);
      }

      // Delete from IndexedDB
      await deleteHistoryItemFromDB(id);

      // Update state
      setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));

      // If the current audio was from this item, clear it
      if (itemToDelete && itemToDelete.audioUrl === audioUrl) {
        setAudioUrl(null);
      }
    } catch (error) {
      console.error(`Failed to delete history item with ID ${id}:`, error);
      toast.error("Failed to delete history item");
    }
  };

  const clearAllHistory = async () => {
    try {
      // Release object URLs to prevent memory leaks
      history.forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });

      // Clear from IndexedDB
      await clearHistory();

      // Update state
      setHistory([]);
      setAudioUrl(null);
      toast.success("History cleared");
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast.error("Failed to clear history");
    }
  };

  const languages: LanguageOption[] = Object.entries(LANGUAGES).map(
    ([code, name]) => ({
      code,
      name,
    })
  );

  return {
    generateSpeech,
    audioUrl,
    history,
    setHistory,
    languages,
    isLoading,
    language,
    setLanguage,
    speed,
    setSpeed,
    text,
    setText,
    isOptimizeWithAI,
    setIsOptimizeWithAI,
    clearAllHistory,
    deleteHistoryItem,
  };
};

export default useTTS;
