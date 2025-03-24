import useTTS from "../hooks/useTTS";
import AudioPlayer from "./AudioPlayer";
import GenerateButton from "./GenerateButton";
import HistoryPanel from "./HistoryPanel";
import SpeedControl from "./SpeedControl";
import TextSettings from "./TextSettings";

const TextToSpeech = () => {
  const {
    generateSpeech,
    audioUrl,
    history,
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
  } = useTTS();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div
            className="flex flex-col md:flex-row gap-6 content-wrapper p-4"
            style={{ maxHeight: "95vh" }}
          >
            {/* Left Panel (TTS) */}
            <div
              id="tts-panel"
              className="md:w-2/3 flex flex-col overflow-y-auto"
            >
              <TextSettings
                text={text}
                setText={setText}
                language={language}
                setLanguage={setLanguage}
                languages={languages}
                isOptimizeWithAI={isOptimizeWithAI}
                setIsOptimizeWithAI={setIsOptimizeWithAI}
                isLoading={isLoading}
              />
              <SpeedControl
                speed={speed}
                setSpeed={setSpeed}
                isLoading={isLoading}
              />
              <GenerateButton
                generateSpeech={() => generateSpeech(text, isOptimizeWithAI)}
                isLoading={isLoading}
              />
              <AudioPlayer audioUrl={audioUrl} isLoading={isLoading} />
            </div>

            {/* Right Panel (History) */}
            <HistoryPanel history={history} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
