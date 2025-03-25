import { Dispatch, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LANGUAGES } from "../constants";
import {
  LanguageOption,
  TTSHistoryItem,
  TTSSettings,
  addItem,
  clearStore,
  deleteItem,
  loadItems,
} from "../libs/indexedDBHelpers";

// Database configuration
const DB_CONFIG = {
  dbName: "ttsDatabase",
  storeNames: ["ttsHistory", "ttsSettings"] as string[],
  dbVersion: 2, // Increment version to trigger schema update
};

// Split interfaces for better organization
interface TTSState {
  language: string;
  text: string;
  isOptimizeWithAI: boolean;
}

interface TTSControls {
  setLanguage: Dispatch<React.SetStateAction<string>>;
  setText: Dispatch<React.SetStateAction<string>>;
  setIsOptimizeWithAI: Dispatch<React.SetStateAction<boolean>>;
}

interface TTSHistory {
  history: TTSHistoryItem[];
  setHistory: Dispatch<React.SetStateAction<TTSHistoryItem[]>>;
  clearAllHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
}

interface TTSAudio {
  audioUrl: string | null;
  isLoading: boolean;
  generateSpeech: (text: string, isOptimizeWithAI: boolean) => Promise<void>;
}

interface UseTextToSpeechResult
  extends TTSState,
    TTSControls,
    TTSHistory,
    TTSAudio {
  languages: LanguageOption[];
}

const useTextToSpeech = (): UseTextToSpeechResult => {
  // Group related states
  const [state, setState] = useState<TTSState>({
    language: "en",
    text: "",
    isOptimizeWithAI: false,
  });

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<TTSHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Memoized state setters
  const setLanguage = useCallback((value: React.SetStateAction<string>) => {
    setState((prev) => ({
      ...prev,
      language: typeof value === "function" ? value(prev.language) : value,
    }));
  }, []);

  const setText = useCallback((value: React.SetStateAction<string>) => {
    setState((prev) => ({
      ...prev,
      text: typeof value === "function" ? value(prev.text) : value,
    }));
  }, []);

  const setIsOptimizeWithAI = useCallback(
    (value: React.SetStateAction<boolean>) => {
      setState((prev) => ({
        ...prev,
        isOptimizeWithAI:
          typeof value === "function" ? value(prev.isOptimizeWithAI) : value,
      }));
    },
    []
  );

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load history
        const historyItems = await loadItems<TTSHistoryItem>(
          DB_CONFIG,
          "ttsHistory",
          "timestamp"
        );

        const processedItems = historyItems
          .map((item) => ({
            ...item,
            audioUrl: URL.createObjectURL(new Blob([item.audioBinary])),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        setHistory(processedItems);

        // Load settings
        const settings = await loadItems<TTSSettings>(
          DB_CONFIG,
          "ttsSettings",
          "id"
        );

        if (settings.length > 0) {
          const loadedSettings = settings[0];
          setState((prev) => ({
            ...prev,
            language: loadedSettings.language,
            text: loadedSettings.text,
            isOptimizeWithAI: loadedSettings.isOptimizeWithAI,
          }));
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        toast.error("Failed to load saved settings and history");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();

    // Cleanup object URLs
    return () => {
      history.forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save settings
  const saveSettings = useCallback(async () => {
    if (isInitializing) return;
    try {
      // Clear existing settings first (silently)
      await clearStore(DB_CONFIG, "ttsSettings", false);
      // Save new settings
      await addItem(DB_CONFIG, "ttsSettings", {
        id: 1,
        language: state.language,
        text: state.text,
        isOptimizeWithAI: state.isOptimizeWithAI,
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    }
  }, [state, isInitializing]);

  // Auto-save settings on change
  useEffect(() => {
    saveSettings();
  }, [state, saveSettings]);

  // Speech generation
  const generateSpeech = useCallback(
    async (text: string, isOptimizeWithAI: boolean) => {
      if (!text.trim()) {
        toast.error("Text input cannot be empty!");
        return;
      }

      setIsLoading(true);
      setAudioUrl(null);

      try {
        const blob = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            language: state.language,
            isOptimizeWithAI,
          }),
        });

        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const audioUrl = URL.createObjectURL(new Blob([arrayBuffer]));

          const newItem: TTSHistoryItem = {
            id: Date.now().toString(),
            text,
            audioUrl,
            audioBinary: arrayBuffer,
            timestamp: Date.now(),
          };

          try {
            await addItem(DB_CONFIG, "ttsHistory", newItem);
            setHistory((prev) => [newItem, ...prev]);
            setAudioUrl(audioUrl);
          } catch (error) {
            console.error("Failed to save history item:", error);
            setAudioUrl(audioUrl); // Still set audio URL for playback
          }
        }
      } catch (error) {
        console.error("Error generating TTS:", error);
        toast.error("Failed to generate speech");
      } finally {
        setIsLoading(false);
      }
    },
    [state.language]
  );

  // History management
  const deleteHistoryItem = useCallback(
    async (id: string) => {
      if (!id) {
        console.error("Invalid ID provided for deletion");
        return;
      }

      try {
        const itemToDelete = history.find((item) => item.id === id);
        if (itemToDelete?.audioUrl) {
          URL.revokeObjectURL(itemToDelete.audioUrl);
        }

        await deleteItem(DB_CONFIG, "ttsHistory", id);
        setHistory((prev) => prev.filter((item) => item.id !== id));

        if (itemToDelete?.audioUrl === audioUrl) {
          setAudioUrl(null);
        }

        toast.success("Speech item successfully removed");
      } catch (error) {
        console.error("Failed to delete history item:", error);
        toast.error("Error attempting to delete history entry");
      }
    },
    [history, audioUrl]
  );

  const clearAllHistory = useCallback(async () => {
    try {
      history.forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });

      await clearStore(DB_CONFIG, "ttsHistory");
      setHistory([]);
      setAudioUrl(null);
      toast.success("Complete speech history successfully erased");
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast.error("Issues encountered while clearing history");
    }
  }, [history]);

  // Languages list
  const languages: LanguageOption[] = Object.entries(LANGUAGES).map(
    ([code, name]) => ({
      code,
      name,
    })
  );

  return {
    // State
    ...state,
    // Controls
    setLanguage,
    setText,
    setIsOptimizeWithAI,
    // Audio
    audioUrl,
    isLoading,
    generateSpeech,
    // History
    history,
    setHistory,
    clearAllHistory,
    deleteHistoryItem,
    // Languages
    languages,
  };
};

export default useTextToSpeech;
