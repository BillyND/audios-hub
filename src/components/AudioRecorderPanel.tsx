import useAudioRecorder from "../hooks/useAudioRecorder";
import { useBreakpoints } from "../hooks/useBreakpoints";
import AudiosHistory from "./AudiosHistory";
import RecordButton from "./RecordButton";
import { useState, useRef } from "react";

const AudioRecorderPanel = () => {
  const { isMobile } = useBreakpoints();
  const {
    startRecording,
    stopRecording,
    isRecording,
    recordings,
    deleteRecording,
    uploadRecordings,
  } = useAudioRecorder();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadingFiles(true);
      try {
        Array.from(files).forEach((file) => {
          console.log("Uploading file:", file.name);
        });
        uploadRecordings(Array.from(files));
      } finally {
        setUploadingFiles(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const audioFiles = Array.from(files).filter(
        (file) => file.type.startsWith("audio/") || file.name.endsWith(".mp3")
      );

      if (audioFiles.length > 0) {
        setUploadingFiles(true);
        try {
          audioFiles.forEach((file) => {
            console.log("Uploading file:", file.name);
          });
          uploadRecordings(audioFiles);
        } finally {
          setUploadingFiles(false);
        }
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div
            className="flex flex-col md:flex-row gap-6 content-wrapper p-4"
            style={isMobile ? {} : { maxHeight: "90vh" }}
          >
            {/* Left Panel (Recording) */}
            <div id="recording-panel" className="md:w-2/3 flex flex-col">
              {/* Audio Recording Section */}
              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h2 className="text-xl font-semibold mb-2">Audio Recorder</h2>
                <p className="text-gray-600 mb-4">
                  Click the button below to start recording audio. Your
                  recordings will be saved automatically.
                </p>
                <RecordButton
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  isRecording={isRecording}
                />
              </div>

              {/* Upload Section - Black and White Theme */}
              <div
                className={`border-2 border-dashed rounded-lg p-5 transition-all duration-200 mb-4 flex flex-col items-center justify-center ${
                  isDragging
                    ? "border-gray-800 bg-gray-100"
                    : "border-gray-300 bg-gray-50 hover:border-gray-600 hover:bg-gray-100"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                style={{ minHeight: "160px", cursor: "pointer" }}
              >
                <input
                  type="file"
                  accept="audio/*,.mp3"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                  ref={fileInputRef}
                />

                <div className="flex flex-col items-center text-center">
                  <svg
                    className={`w-10 h-10 mb-3 ${
                      isDragging ? "text-gray-800" : "text-gray-500"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>

                  <h3 className="text-lg font-medium mb-1">
                    {uploadingFiles ? "Uploading..." : "Upload Audio Files"}
                  </h3>

                  <p className="text-gray-500 text-sm mb-3">
                    Drag and drop audio files or click to browse
                  </p>

                  <button
                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput();
                    }}
                  >
                    Select Files
                  </button>

                  <p className="text-xs text-gray-500 mt-3">
                    Supports MP3 and other audio formats
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel (History) */}
            <AudiosHistory items={recordings} deleteItem={deleteRecording} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorderPanel;
