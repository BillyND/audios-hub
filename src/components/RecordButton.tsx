import { Mic, Square } from "lucide-react";
import React from "react";

interface RecordButtonProps {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  startRecording,
  stopRecording,
  isRecording,
}) => {
  const handleClick = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleClick}
        disabled={false}
        className={`mt-4 w-full p-3 font-semibold rounded-lg transition flex items-center justify-center ${
          isRecording
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-black hover:bg-gray-800 text-white"
        }`}
      >
        {isRecording ? (
          <>
            <Square className="mr-2" size={18} />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2" size={18} />
            Start Recording
          </>
        )}
      </button>
    </div>
  );
};

export default RecordButton;
