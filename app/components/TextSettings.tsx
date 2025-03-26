import React, { useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";

interface TextSettingsProps {
  text: string;
  setText: (text: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  languages: { code: string; name: string }[];
  isOptimizeWithAI: boolean;
  setIsOptimizeWithAI: (isOptimizeWithAI: boolean) => void;
  isLoading: boolean;
}

const TextSettings: React.FC<TextSettingsProps> = ({
  text,
  setText,
  isOptimizeWithAI,
  setIsOptimizeWithAI,
  isLoading,
}) => {
  const [localText, setLocalText] = useState(text);
  const [isOptimizeAIState, setIsOptimizeAIState] = useState(isOptimizeWithAI);
  const debouncedText = useDebounce(localText, 100);
  const debouncedIsOptimizeWithAI = useDebounce(isOptimizeAIState, 100);

  useEffect(() => {
    setText(debouncedText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText]);

  useEffect(() => {
    if (text !== debouncedText) {
      setLocalText(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    setIsOptimizeWithAI(debouncedIsOptimizeWithAI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedIsOptimizeWithAI]);

  useEffect(() => {
    if (isOptimizeWithAI !== debouncedIsOptimizeWithAI) {
      setIsOptimizeAIState(isOptimizeWithAI);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOptimizeWithAI]);

  return (
    <div style={{ marginBottom: "-12px" }}>
      <span className="block text-gray-700">Enter Text:</span>
      <textarea
        id="textInput"
        className="w-full p-3 text-gray-700 rounded-md focus:ring-blue-500 transition resize-none h-24 border border-gray-300 focus:outline-none focus:border-gray-700"
        placeholder="Type your text here..."
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        disabled={isLoading}
      />
    </div>
  );
};

export default TextSettings;
