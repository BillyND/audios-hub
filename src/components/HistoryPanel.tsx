import { Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useBreakpoints } from "../hooks/useBreakpoints";
import CustomAudioPlayer from "./CustomAudioPlayer";
import Modal from "./Modal";

interface HistoryPanelProps {
  history: { text: string; audioUrl: string }[];
  setHistory: React.Dispatch<
    React.SetStateAction<{ text: string; audioUrl: string }[]>
  >;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, setHistory }) => {
  const { isMobile } = useBreakpoints();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDeletionIndex, setPendingDeletionIndex] = useState<
    number | null
  >(null);

  const handleDelete = (indexToDelete: number) => {
    setHistory((prevHistory) =>
      prevHistory.filter((_, index) => index !== indexToDelete)
    );
    setIsModalOpen(false);
  };

  const openModal = (index: number) => {
    setPendingDeletionIndex(index);
    setIsModalOpen(true);
  };

  return (
    <div
      id="history-panel"
      className="md:w-1/3 flex flex-col md:overflow-y-auto"
      style={isMobile ? {} : { maxHeight: "90vh" }}
    >
      <h3 className="text-lg font-semibold mb-3">History</h3>
      <div id="historyContainer" className="space-y-3">
        {history.map((item, index) => {
          const truncatedText =
            item.text.length > 50 ? `${item.text.slice(0, 50)}...` : item.text;
          return (
            <div
              key={index}
              className="p-3 bg-gray-100 rounded-md flex justify-between align-items-start"
            >
              <div>
                <div className="flex justify-between gap-2">
                  <p
                    className="text-sm text-gray-700"
                    style={{ wordBreak: "break-word" }}
                  >
                    {truncatedText}
                  </p>

                  <button
                    onClick={() => openModal(index)}
                    className="text-red-500 flex justify-between align-items-start"
                  >
                    <Trash2 width={16} height={16} />
                  </button>
                </div>
                <CustomAudioPlayer audioUrl={item.audioUrl} />
              </div>
            </div>
          );
        })}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Deletion"
        content={
          <div className="flex flex-col items-center">
            <p>Are you sure you want to delete this item?</p>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded flex items-center justify-center text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingDeletionIndex !== null)
                    handleDelete(pendingDeletionIndex);
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center justify-center text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default HistoryPanel;
