import { v4 as uuidv4 } from "uuid";
import { useState, useEffect, useRef, useCallback } from "react";
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);

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

      // Ensure any active stream is stopped
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    // Don't allow starting a new recording if one is in progress
    if (isRecording) {
      toast.error("Recording already in progress");
      return;
    }

    try {
      // Get audio stream with a more robust error handler
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Store stream reference to clean up later
      streamRef.current = stream;

      // Reset audio chunks before starting
      audioChunksRef.current = [];

      // Set options for better compatibility across browsers
      const options = {
        mimeType: "audio/webm;codecs=opus",
      };

      // Try to create MediaRecorder with preferred options, fall back if not supported
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.warn("Preferred MIME type not supported, using default", e);
        recorder = new MediaRecorder(stream);
      }

      // Handle data available event
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Error handler for MediaRecorder
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
        cleanupRecording();
      };

      // Store recorder reference
      mediaRecorderRef.current = recorder;

      // Start recording with 10ms time slices for more frequent ondataavailable events
      recorder.start(1000);
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);

      // More specific error messages based on error type
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.error("Microphone access denied. Please check permissions.");
      } else if (
        error instanceof DOMException &&
        error.name === "NotFoundError"
      ) {
        toast.error("No microphone detected on your device.");
      } else {
        toast.error(
          "Failed to start recording. Please check microphone access."
        );
      }

      cleanupRecording();
    }
  }, [isRecording]);

  // Cleanup function to handle stopping streams and resetting state
  const cleanupRecording = useCallback(() => {
    // Stop all tracks on the stream if exists
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Reset recorder
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      toast.error("No active recording to stop");
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        try {
          if (audioChunksRef.current.length === 0) {
            toast.error("No audio data captured");
            cleanupRecording();
            resolve();
            return;
          }

          // Determine best format based on browser support
          const mimeType = recorder.mimeType || "audio/webm";
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });

          // Validate blob size
          if (audioBlob.size === 0) {
            toast.error("Recorded audio is empty");
            cleanupRecording();
            resolve();
            return;
          }

          // Convert blob to array buffer with proper error handling
          let arrayBuffer: ArrayBuffer;
          try {
            arrayBuffer = await audioBlob.arrayBuffer();
          } catch (error) {
            console.error(
              "Failed to convert audio blob to array buffer:",
              error
            );
            toast.error("Failed to process recording");
            cleanupRecording();
            resolve();
            return;
          }

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

            // Update state with functional update to avoid stale state issues
            setRecordings((prevRecordings) => [newItem, ...prevRecordings]);
            toast.success("Recording saved");
          } catch (error) {
            console.error("Failed to save recording:", error);
            toast.error("Failed to save recording");
            // Make sure to revoke the URL if saving fails
            URL.revokeObjectURL(audioUrl);
          }

          cleanupRecording();
          resolve();
        } catch (error) {
          console.error("Error processing recording:", error);
          toast.error("Failed to process recording");
          cleanupRecording();
          resolve();
        }
      };

      // Sometimes stop() can throw if there's an issue with the recorder state
      try {
        recorder.stop();
      } catch (error) {
        console.error("Error stopping MediaRecorder:", error);
        toast.error("Failed to stop recording properly");
        cleanupRecording();
        resolve();
      }
    });
  }, [cleanupRecording]);

  const deleteRecording = useCallback(
    async (id: string) => {
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

        // Update state with functional update
        setRecordings((prevRecordings) =>
          prevRecordings.filter((item) => item.id !== id)
        );
        toast.success("Recording deleted");
      } catch (error) {
        console.error(`Failed to delete recording with ID ${id}:`, error);
        toast.error("Failed to delete recording");
      }
    },
    [recordings]
  );

  const clearAllRecordings = useCallback(async () => {
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
  }, [recordings]);

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
