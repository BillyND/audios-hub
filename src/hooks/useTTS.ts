import { Dispatch, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchTTSData } from "../api/newsApi";
import { LANGUAGES } from "../constants";
import {
  TTSHistoryItem,
  TTSSettings,
  LanguageOption,
  addItem,
  deleteItem,
  loadItems,
  clearStore,
} from "../libs/indexedDBHelpers";

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

const dbConfig = {
  dbName: "ttsDatabase",
  storeNames: ["ttsHistory", "ttsSettings"],
  dbVersion: 1,
};

const useTTS = (): UseTTSResult => {
  const [language, setLanguage] = useState("en");
  const [speed, setSpeed] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<TTSHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [isOptimizeWithAI, setIsOptimizeWithAI] = useState(false);

  // Initialize the database and load initial data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load history using the shared loadItems function
        const historyItems = await loadItems<TTSHistoryItem>(
          dbConfig,
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

        // Load settings using the shared loadItems function
        const settings = await loadItems<TTSSettings>(
          dbConfig,
          "ttsSettings",
          "id" // Ensure the correct index
        );

        if (settings.length > 0) {
          const loadedSettings = settings[0];
          setLanguage(loadedSettings.language);
          setSpeed(loadedSettings.speed);
          setText(loadedSettings.text);
          setIsOptimizeWithAI(loadedSettings.isOptimizeWithAI);
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        toast.error("Failed to load saved audios");
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
    const saveAllSettings = async () => {
      try {
        await addItem(dbConfig, "ttsSettings", {
          id: "1", // Ensure id is consistent for single settings record
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
  }, [language, speed, text, isOptimizeWithAI]);

  const generateSpeech = async (text: string, isOptimizeWithAI: boolean) => {
    if (!text) {
      toast.error("Text input cannot be empty!");
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

        const newItem: TTSHistoryItem = {
          id: Date.now().toString(),
          text,
          audioUrl,
          audioBinary: arrayBuffer,
          timestamp: Date.now(),
        };

        try {
          await addItem(dbConfig, "ttsHistory", newItem);
          setHistory((prevHistory) => [newItem, ...prevHistory]);
          setAudioUrl(audioUrl);
        } catch (error) {
          console.error("Failed to save history item:", error);
          toast.error("Speech generated but not saved to history");
          // Still set the audio URL so it can be played
          setAudioUrl(audioUrl);
        }
      }
    } catch (error) {
      console.error("Error generating TTS:", error);
      toast.error("Speech synthesis failed. Try again later.");
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
      const itemToDelete = history.find((item) => item.id === id);
      if (itemToDelete && itemToDelete.audioUrl) {
        URL.revokeObjectURL(itemToDelete.audioUrl);
      }

      await deleteItem(dbConfig, "ttsHistory", id);
      setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));

      // If the current audio was from this item, clear it
      if (itemToDelete && itemToDelete.audioUrl === audioUrl) {
        setAudioUrl(null);
      }

      toast.success("Speech item successfully removed");
    } catch (error) {
      console.error(`Failed to delete history item with ID ${id}:`, error);
      toast.error("Error attempting to delete history entry");
    }
  };

  const clearAllHistory = async () => {
    try {
      history.forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });

      await clearStore(dbConfig, "ttsHistory");
      setHistory([]);
      setAudioUrl(null);
      toast.success("Complete speech history successfully erased");
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast.error("Issues encountered while clearing history");
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
