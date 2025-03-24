import { useEffect, useState, useMemo } from "react";
import { Toaster } from "react-hot-toast";
import "./App.css";
import TextToSpeech from "./components/TextToSpeech";
import AudioRecorderPanel from "./components/AudioRecorderPanel";

enum Tab {
  TTS = "tts",
  AUDIO_RECORDER = "audio_recorder",
}

const getDefaultTab = (): Tab => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlSearchParams.get("tab") as Tab;
  return Object.values(Tab).includes(tabFromUrl) ? tabFromUrl : Tab.TTS;
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(getDefaultTab);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.pushState({}, "", url.toString());
  }, [activeTab]);

  const tabComponents = useMemo(
    () => ({
      [Tab.TTS]: <TextToSpeech />,
      [Tab.AUDIO_RECORDER]: <AudioRecorderPanel />,
    }),
    []
  );

  const renderTabButton = useMemo(
    () => (tab: Tab, label: string) =>
      (
        <button
          className={`tab-btn flex-1 py-2 text-center rounded-md ${
            activeTab === tab
              ? "bg-black text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {label}
        </button>
      ),
    [activeTab]
  );

  return (
    <div className="bg-white text-gray-900 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
            borderRadius: "8px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            padding: "16px",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
            style: {
              borderLeft: "4px solid #10B981",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
            style: {
              borderLeft: "4px solid #EF4444",
            },
          },
          loading: {
            style: {
              borderLeft: "4px solid #3B82F6",
            },
          },
        }}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        containerClassName="toast-container"
        gutter={8}
      />
      <div className="max-w-5xl mx-auto p-0 sm:p-6 sm:pt-0 pt-0">
        <div
          className="flex gap-4 px-4"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "white",
            paddingBlock: "16px",
            boxShadow: "0 6px 8px -4px rgba(0, 0, 0, 0.05)",
          }}
        >
          {renderTabButton(Tab.TTS, "Text to Speech")}
          {renderTabButton(Tab.AUDIO_RECORDER, "Audio Recorder")}
        </div>
        {tabComponents[activeTab]}
      </div>
    </div>
  );
}

export default App;
