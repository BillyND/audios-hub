import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface UseAudioRecorderResult {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
  recordings: RecordingItem[];
  deleteRecording: (id: string) => Promise<void>;
  clearAllRecordings: () => Promise<void>;
}

export interface RecordingItem {
  id: string;
  audioUrl: string;
  audioBinary: ArrayBuffer;
  timestamp: number;
  text: string;
}

// IndexedDB helper functions
const dbName = "audioRecorderDatabase";
const recordingsStoreName = "recordings";
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

      // Create recordings object store with UUID as id
      if (!db.objectStoreNames.contains(recordingsStoreName)) {
        const recordingsStore = db.createObjectStore(recordingsStoreName, {
          keyPath: "id",
        });
        recordingsStore.createIndex("timestamp", "timestamp", {
          unique: false,
        });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

// Function to add a recording
const addRecording = async (item: RecordingItem): Promise<string> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(recordingsStoreName, "readwrite");
      const store = transaction.objectStore(recordingsStoreName);

      const request = store.add(item);

      request.onsuccess = () => {
        resolve(request.result as string);
      };

      request.onerror = (event) => {
        console.error("Error adding recording:", event);
        reject(new Error("Failed to add recording"));
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error adding recording:", error);
    throw error;
  }
};

// Function to delete a specific recording by ID
const deleteRecordingFromDB = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(recordingsStoreName, "readwrite");
      const store = transaction.objectStore(recordingsStoreName);

      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error(`Error deleting recording with ID ${id}:`, event);
        reject(new Error(`Failed to delete recording with ID ${id}`));
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Error deleting recording with ID ${id}:`, error);
    throw error;
  }
};

// Function to load all recordings
const loadRecordings = async (): Promise<RecordingItem[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(recordingsStoreName, "readonly");
      const store = transaction.objectStore(recordingsStoreName);
      const index = store.index("timestamp");

      const request = index.getAll();

      request.onsuccess = () => {
        const items = request.result as RecordingItem[];
        // Create URLs for AudioBuffers and sort by timestamp (newest first)
        const processedItems = items
          .map((item) => ({
            ...item,
            audioUrl: URL.createObjectURL(new Blob([item.audioBinary])),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        resolve(processedItems);
      };

      request.onerror = (event) => {
        console.error("Error loading recordings:", event);
        reject(new Error("Failed to load recordings"));
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error loading recordings:", error);
    return [];
  }
};

// Function to clear all recordings
const clearRecordings = async (): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(recordingsStoreName, "readwrite");
      const store = transaction.objectStore(recordingsStoreName);

      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error("Error clearing recordings:", event);
        reject(new Error("Failed to clear recordings"));
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error clearing recordings:", error);
    throw error;
  }
};

const useAudioRecorder = (): UseAudioRecorderResult => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Initialize the database and load initial data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load recordings
        const recordingItems = await loadRecordings();
        setRecordings(recordingItems);
      } catch (error) {
        console.error("Failed to initialize:", error);
        toast.error("Failed to load saved recordings");
      }
    };

    initializeApp();

    // Clean up function to revoke object URLs when component unmounts
    return () => {
      recordings.forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      setAudioChunks([]);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        } else {
          console.error(
            "Received undefined or empty data in ondataavailable event:",
            event
          );
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder) {
      toast.error("No active recording");
      return;
    }

    return new Promise<void>((resolve) => {
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioUrl = URL.createObjectURL(audioBlob);

          const timestamp = Date.now();
          const formattedDate = new Date(timestamp).toLocaleString();

          // Create recording item with UUID
          const newItem: RecordingItem = {
            id: uuidv4(),
            audioUrl,
            audioBinary: arrayBuffer,
            timestamp,
            text: `Recording from ${formattedDate}`,
          };

          try {
            // Save to IndexedDB
            await addRecording(newItem);

            // Update state
            setRecordings((prevRecordings) => [newItem, ...prevRecordings]);
            toast.success("Recording saved");
          } catch (error) {
            console.error("Failed to save recording:", error);
            toast.error("Failed to save recording");
          }

          // Stop all tracks on the stream
          mediaRecorder.stream.getTracks().forEach((track) => track.stop());

          setIsRecording(false);
          setMediaRecorder(null);
          resolve();
        } catch (error) {
          console.error("Error processing recording:", error);
          toast.error("Failed to process recording");
          setIsRecording(false);
          setMediaRecorder(null);
          resolve();
        }
      };

      mediaRecorder.stop();
    });
  };

  const deleteRecording = async (id: string) => {
    if (!id) {
      console.error("Invalid ID provided for deletion");
      return;
    }

    try {
      // First find the item to get its URL for revocation
      const itemToDelete = recordings.find((item) => item.id === id);
      if (itemToDelete && itemToDelete.audioUrl) {
        URL.revokeObjectURL(itemToDelete.audioUrl);
      }

      // Delete from IndexedDB
      await deleteRecordingFromDB(id);

      // Update state
      setRecordings((prevRecordings) =>
        prevRecordings.filter((item) => item.id !== id)
      );
      toast.success("Recording deleted");
    } catch (error) {
      console.error(`Failed to delete recording with ID ${id}:`, error);
      toast.error("Failed to delete recording");
    }
  };

  const clearAllRecordings = async () => {
    try {
      // Release object URLs to prevent memory leaks
      recordings.forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });

      // Clear from IndexedDB
      await clearRecordings();

      // Update state
      setRecordings([]);
      toast.success("All recordings cleared");
    } catch (error) {
      console.error("Failed to clear recordings:", error);
      toast.error("Failed to clear recordings");
    }
  };

  return {
    startRecording,
    stopRecording,
    isRecording,
    recordings,
    deleteRecording,
    clearAllRecordings,
  };
};

export default useAudioRecorder;
