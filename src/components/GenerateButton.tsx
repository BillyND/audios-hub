import React from "react";

interface GenerateButtonProps {
  generateSpeech: () => Promise<void>;
  isLoading: boolean;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({
  generateSpeech,
  isLoading,
}) => {
  return (
    <button
      id="generateButton"
      className={`mt-4 w-full p-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition flex items-center justify-center ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={generateSpeech}
      disabled={isLoading}
    >
      Generate Speech
    </button>
  );
};

export default GenerateButton;
