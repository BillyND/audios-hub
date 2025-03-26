import { OPENAI_VOICES } from "../constants";
import { useBreakpoints } from "../hooks/useBreakpoints";
import useTextToSpeech from "../hooks/useTextToSpeech";
import AudioPlayer from "./AudioPlayer";
import AudiosHistory from "./AudiosHistory";
import GenerateButton from "./GenerateButton";
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
    text,
    setText,
    isOptimizeWithAI,
    setIsOptimizeWithAI,
    voice,
    setVoice,
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

              <div className="flex flex-col">
                <label
                  htmlFor="voice-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Select Voice
                </label>
                <select
                  id="voice-select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {Object.entries(OPENAI_VOICES).map(
                    ([voiceKey, voiceLabel]) => (
                      <option key={voiceKey} value={voiceKey}>
                        {voiceLabel}
                      </option>
                    )
                  )}
                </select>
              </div>

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
