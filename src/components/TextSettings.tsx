import React, { useState, useEffect } from "react";
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
  language,
  setLanguage,
  languages,
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
  }, [debouncedText, setText]);

  useEffect(() => {
    setIsOptimizeWithAI(debouncedIsOptimizeWithAI);
  }, [debouncedIsOptimizeWithAI, setIsOptimizeWithAI]);

  return (
    <>
      <div className="mb-2">
        <label className="block text-gray-700 mb-2">Enter Text:</label>
        <textarea
          id="textInput"
          className="w-full p-3 text-gray-700 rounded-md focus:ring-blue-500 transition resize-none h-24 border border-gray-300 focus:outline-none focus:border-gray-700"
          placeholder="Type your text here..."
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          disabled={isLoading}
        ></textarea>
      </div>
      <div className="mt-4">
        <label className="block text-gray-700 mb-2">Select Language:</label>
        <select
          id="languageSelect"
          className="w-full p-3 text-gray-900 rounded-md border border-gray-200"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isLoading}
        >
          {languages &&
            languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
        </select>
      </div>
      <div className="mt-4 flex items-center">
        <label
          htmlFor="optimizeWithAI"
          className="block text-gray-700 cursor-pointer"
        >
          Optimize with AI:
        </label>
        <input
          type="checkbox"
          id="optimizeWithAI"
          className="checkbox w-4 h-4 mx-2"
          checked={isOptimizeAIState}
          onChange={(e) => setIsOptimizeAIState(e.target.checked)}
          disabled={isLoading}
        />
      </div>
    </>
  );
};

export default TextSettings;
