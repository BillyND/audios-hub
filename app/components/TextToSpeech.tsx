import { OPENAI_VOICES } from "../constants";
import { useBreakpoints } from "../hooks/useBreakpoints";
import useTextToSpeech from "../hooks/useTextToSpeech";
import AudioPlayer from "./AudioPlayer";
import AudiosHistory from "./AudiosHistory";
import GenerateButton from "./GenerateButton";
import CustomDropdown from "./CustomDropdown";
import TextSettings from "./TextSettings";

const TextToSpeech = () => {
  const { isMobile } = useBreakpoints();

  const {
    // State variables
    audioUrl,
    history,
    isLoading,
    text,
    language,
    languages,
    voice,
    isOptimizeWithAI,

    // Setter functions
    deleteHistoryItem,
    setLanguage,
    setText,
    setIsOptimizeWithAI,
    setVoice,

    // Methods
    generateSpeech,
  } = useTextToSpeech();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div
            className="flex flex-col md:flex-row gap-6 content-wrapper p-4"
            style={isMobile ? {} : { maxHeight: "90vdh" }}
          >
            {/* Left Panel (TTS) */}
            <div id="tts-panel" className="md:w-2/3 flex flex-col gap-4">
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

              <div className="flex flex-col">
                <span className="block text-gray-700"> Select Voice</span>
                <CustomDropdown
                  options={OPENAI_VOICES}
                  value={voice}
                  onChange={setVoice}
                />
              </div>

              <GenerateButton
                generateSpeech={() =>
                  generateSpeech(text, isOptimizeWithAI, voice)
                }
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
