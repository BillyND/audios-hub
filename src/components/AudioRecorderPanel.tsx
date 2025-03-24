import useAudioRecorder from "../hooks/useAudioRecorder";
import { useBreakpoints } from "../hooks/useBreakpoints";
import AudiosHistory from "./AudiosHistory";
import RecordButton from "./RecordButton";

const AudioRecorderPanel = () => {
  const { isMobile } = useBreakpoints();
  const {
    startRecording,
    stopRecording,
    isRecording,
    recordings,
    deleteRecording,
  } = useAudioRecorder();

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
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
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
