import { useState, useEffect, Dispatch } from "react";
import { fetchTTSData } from "../api/newsApi";
import { LANGUAGES } from "../constants";
import toast from "react-hot-toast";

interface TTSResult {
  audioUrl: string;
}

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
}

interface TTSHistoryItem {
  text: string;
  audioUrl: string;
}

interface LanguageOption {
  code: string;
  name: string;
}

const useTTS = (): UseTTSResult => {
  const initLanguage = localStorage.getItem("selectedLanguage") || "en";
  const initSpeed = (() => {
    const localSpeed = parseFloat(localStorage.getItem("selectedSpeed") || "1");
    return localSpeed < 0.5 || localSpeed > 2 ? 1 : localSpeed;
  })();
  const initText = localStorage.getItem("currentText") || "";
  const initIsOptimizeWithAI =
    localStorage.getItem("selectedIsOptimizeWithAI") === "true";

  const [language, setLanguage] = useState(initLanguage);
  const [speed, setSpeed] = useState(initSpeed);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<TTSHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState(initText);
  const [isOptimizeWithAI, setIsOptimizeWithAI] =
    useState(initIsOptimizeWithAI);

  useEffect(() => {
    localStorage.setItem("selectedLanguage", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("selectedSpeed", String(speed));
  }, [speed]);

  useEffect(() => {
    localStorage.setItem("currentText", text);
  }, [text]);

  useEffect(() => {
    localStorage.setItem("selectedIsOptimizeWithAI", String(isOptimizeWithAI));
  }, [isOptimizeWithAI]);

  const generateSpeech = async (text: string, isOptimizeWithAI: boolean) => {
    if (!text) {
      toast.error("Please enter some text!");
      return;
    }

    setIsLoading(true);
    setAudioUrl(null);
    try {
      const data: TTSResult = await fetchTTSData(
        text,
        language,
        speed,
        isOptimizeWithAI
      );

      if (data.audioUrl) {
        console.log(data);
        setHistory((prevHistory) => [
          { text: text, audioUrl: data.audioUrl },
          ...prevHistory,
        ]);
        setAudioUrl(data.audioUrl);
      }
    } catch (error) {
      console.error("Error generating TTS:", error);
    } finally {
      setIsLoading(false);
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
  };
};

export default useTTS;
