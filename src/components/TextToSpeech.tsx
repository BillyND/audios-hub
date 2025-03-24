import { useBreakpoints } from "../hooks/useBreakpoints";
import useTTS from "../hooks/useTTS";
import AudioPlayer from "./AudioPlayer";
import GenerateButton from "./GenerateButton";
import AudiosHistory from "./AudiosHistory";
import SpeedControl from "./SpeedControl";
import TextSettings from "./TextSettings";

const TextToSpeech = () => {
  const { isMobile } = useBreakpoints();

  const {
    generateSpeech,
    audioUrl,
    history,
    languages,
    isLoading,
    language,
    deleteHistoryItem,
    setLanguage,
    speed,
    setSpeed,
    text,
    setText,
    isOptimizeWithAI,
    setIsOptimizeWithAI,
  } = useTTS();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div
            className="flex flex-col md:flex-row gap-6 content-wrapper p-4"
            style={isMobile ? {} : { maxHeight: "90vdh" }}
          >
            {/* Left Panel (TTS) */}
            <div id="tts-panel" className="md:w-2/3 flex flex-col">
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

            {/* Right Panel: History of Audios */}
            <AudiosHistory audios={history} deleteItem={deleteHistoryItem} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
