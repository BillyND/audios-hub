// src/hooks/useAudioRecorder.ts

import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  RecordingItem,
  addItem,
  deleteItem,
  loadItems,
  clearStore,
} from "../libs/indexedDBHelpers";

interface UseAudioRecorderResult {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
  recordings: RecordingItem[];
  deleteRecording: (id: string) => Promise<void>;
  clearAllRecordings: () => Promise<void>;
  uploadRecordings: (files: File[]) => Promise<void>;
}

const dbConfig = {
  dbName: "audioRecorderDatabase",
  storeNames: ["recordings"],
  dbVersion: 1,
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
        // Load recordings using the shared loadItems function
        const recordingItems = await loadItems<RecordingItem>(
          dbConfig,
          "recordings",
          "timestamp"
        );

        const processedItems = recordingItems
          .map((item) => ({
            ...item,
            audioUrl: URL.createObjectURL(new Blob([item.audioBinary])),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        setRecordings(processedItems);
      } catch (error) {
        console.error("Failed to initialize:", error);
        toast.error("Failed to load saved audios");
      }
    };

    initializeApp();

    // Clean up function to revoke object URLs and stop media streams when component unmounts
    return () => {
      recordings.forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      toast.error("Recording already in progress");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
      } catch (e) {
        console.warn("Preferred MIME type not supported, using default", e);
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
        cleanupRecording();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Start recording with 1-second intervals
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
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
  }, [cleanupRecording, isRecording]);

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

          const mimeType = recorder.mimeType || "audio/webm";
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });

          if (audioBlob.size === 0) {
            toast.error("Recorded audio is empty");
            cleanupRecording();
            resolve();
            return;
          }

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

          const newItem: RecordingItem = {
            id: timestamp.toString(),
            audioUrl,
            audioBinary: arrayBuffer,
            timestamp,
            text: `Rec ${new Date(timestamp).toLocaleString()}`,
          };

          try {
            await addItem(dbConfig, "recordings", newItem);
            setRecordings((prevRecordings) => [newItem, ...prevRecordings]);
            toast.success("Recording saved");
          } catch (error) {
            console.error("Failed to save recording:", error);
            toast.error("Failed to save recording");
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
        const itemToDelete = recordings.find((item) => item.id === id);
        if (itemToDelete && itemToDelete.audioUrl) {
          URL.revokeObjectURL(itemToDelete.audioUrl);
        }

        await deleteItem(dbConfig, "recordings", id);
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
      recordings.forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });

      await clearStore(dbConfig, "recordings");
      setRecordings([]);
      toast.success("All recordings cleared");
    } catch (error) {
      console.error("Failed to clear recordings:", error);
      toast.error("Failed to clear recordings.");
    }
  }, [recordings]);

  const uploadRecordings = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) {
      toast.error("No files selected for upload.");
      return;
    }

    try {
      const newRecordings: RecordingItem[] = [];

      for (const file of files) {
        if (file.type !== "audio/mpeg") {
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const audioUrl = URL.createObjectURL(file);
        const timestamp = Date.now();

        const newItem: RecordingItem = {
          id: timestamp.toString(),
          audioUrl,
          audioBinary: arrayBuffer,
          timestamp,
          text: `Upload ${new Date(timestamp).toLocaleString()}`,
        };

        await addItem(dbConfig, "recordings", newItem);
        newRecordings.push(newItem);
      }

      if (newRecordings.length > 0) {
        setRecordings((prevRecordings) => [
          ...newRecordings,
          ...prevRecordings,
        ]);
        toast.success(
          `${newRecordings.length} recording(s) uploaded successfully.`
        );
      }
    } catch (error) {
      console.error("Failed to upload recordings:", error);
      toast.error("Failed to upload recordings.");
    }
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording,
    recordings,
    deleteRecording,
    clearAllRecordings,
    uploadRecordings,
  };
};

export default useAudioRecorder;
