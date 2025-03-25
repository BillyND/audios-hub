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
        <footer className="mt-8 py-6 border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                © {new Date().getFullYear()} Audios Hub. All rights reserved.
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="https://github.com/BillyND/voice-hub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
