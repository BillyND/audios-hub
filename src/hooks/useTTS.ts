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
  history: { text: string; audioUrl: string }[];
  languages: { code: string; name: string }[];
  isLoading: boolean;
  language: string;
  setLanguage: Dispatch<React.SetStateAction<string>>;
  speed: number;
  setSpeed: Dispatch<React.SetStateAction<number>>;
}

const useTTS = (): UseTTSResult => {
  const [language, setLanguage] = useState(
    localStorage.getItem("selectedLanguage") || "en"
  );
  const [speed, setSpeed] = useState(
    parseFloat(localStorage.getItem("selectedSpeed") || "1")
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<{ text: string; audioUrl: string }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("selectedLanguage", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("selectedSpeed", String(speed));
  }, [speed]);

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

  const languages = Object.entries(LANGUAGES).map(([code, name]) => ({
    code,
    name,
  }));

  console.log({ history });

  return {
    generateSpeech,
    audioUrl,
    history,
    languages,
    isLoading,
    language,
    setLanguage,
    speed,
    setSpeed,
  };
};

export default useTTS;
