import React from "react";
import CustomAudioPlayer from "./CustomAudioPlayer";

interface HistoryPanelProps {
  history: { text: string; audioUrl: string }[];
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
  return (
    <div
      id="history-panel"
      className="md:w-1/3 flex flex-col md:overflow-y-auto" // Conditionally apply overflow-y-auto
      style={{ maxHeight: "90vh" }}
    >
      <h3 className="text-lg font-semibold mb-3">History</h3>
      <div id="historyContainer" className="space-y-3">
        {history.map((item, index) => {
          const truncatedText =
            item.text.length > 50 ? `${item.text.slice(0, 50)}...` : item.text;
          return (
            <div key={index} className="p-3 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-700">{truncatedText}</p>
              <CustomAudioPlayer audioUrl={item.audioUrl} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryPanel;
