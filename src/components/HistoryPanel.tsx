import { Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useBreakpoints } from "../hooks/useBreakpoints";
import CustomAudioPlayer from "./CustomAudioPlayer";
import Modal from "./Modal";

interface HistoryPanelProps {
  history: { id: string; text: string; audioUrl: string }[];
  deleteHistoryItem: (id: string) => Promise<void>;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  deleteHistoryItem,
}) => {
  const { isMobile } = useBreakpoints();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDeletionId, setPendingDeletionId] = useState<string | null>(
    null
  );

  const handleDelete = async (id: string) => {
    const itemToDelete = history.find((item) => item.id === id);
    if (!itemToDelete) {
      console.error("No item found with id:", id);
      return;
    }

    console.log("Deleting item:", itemToDelete);

    try {
      await deleteHistoryItem(id);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }

    setIsModalOpen(false);
  };

  const openModal = (id: string) => {
    setPendingDeletionId(id);
    setIsModalOpen(true);
  };

  return (
    <div
      id="history-panel"
      className="md:w-1/3 flex flex-col"
      style={isMobile ? {} : { height: "calc(100dvh - 170px)" }}
    >
      <h3 className="text-lg font-semibold mb-1">History</h3>
      <div id="historyContainer" className="space-y-3 md:overflow-y-auto">
        {history.map((item) => {
          const truncatedText =
            item.text.length > 50 ? `${item.text.slice(0, 50)}...` : item.text;
          return (
            <div
              key={item.id}
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
                    onClick={() => openModal(item.id)}
                    className="text-red-500 flex justify-between align-items-start"
                  >
                    <Trash2 width={16} height={16} />
                  </button>
                </div>
                <CustomAudioPlayer
                  audioUrl={item.audioUrl}
                  title={truncatedText}
                />
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
                  if (pendingDeletionId !== null)
                    handleDelete(pendingDeletionId);
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
