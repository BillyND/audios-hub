import { Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useBreakpoints } from "../hooks/useBreakpoints";
import { RecordingItem } from "../hooks/useAudioRecorder";
import CustomAudioPlayer from "./CustomAudioPlayer";
import Modal from "./Modal";

interface RecordingsPanelProps {
  recordings: RecordingItem[];
  deleteRecording: (id: string) => Promise<void>;
}

const RecordingsPanel: React.FC<RecordingsPanelProps> = ({
  recordings,
  deleteRecording,
}) => {
  const { isMobile } = useBreakpoints();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDeletionId, setPendingDeletionId] = useState<string | null>(
    null
  );

  const handleDelete = async (id: string) => {
    const itemToDelete = recordings.find((item) => item.id === id);
    if (!itemToDelete) {
      console.error("No item found with id:", id);
      return;
    }

    console.log("Deleting item:", itemToDelete);

    try {
      await deleteRecording(id);
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
      id="recordings-panel"
      className="md:w-1/3 flex flex-col"
      style={isMobile ? {} : { height: "calc(100dvh - 170px)" }}
    >
      <h3 className="text-lg font-semibold mb-1">Recordings</h3>
      <div id="recordingsContainer" className="space-y-3 md:overflow-y-auto">
        {recordings.map((item) => {
          return (
            <div
              key={item.id}
              className="p-3 bg-gray-100 rounded-md flex justify-between align-items-start"
            >
              <div className="w-full">
                <div className="flex justify-between gap-2">
                  <p
                    className="text-sm text-gray-700"
                    style={{ wordBreak: "break-word" }}
                  >
                    {item.text}
                  </p>

                  <button
                    onClick={() => openModal(item.id)}
                    className="text-red-500 flex justify-between align-items-start"
                  >
                    <Trash2 width={16} height={16} />
                  </button>
                </div>
                <CustomAudioPlayer audioUrl={item.audioUrl} title={item.text} />
              </div>
            </div>
          );
        })}
        {recordings.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No recordings yet. Click the record button to start recording.
          </div>
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Deletion"
        content={
          <div className="flex flex-col items-center">
            <p>Are you sure you want to delete this recording?</p>

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

export default RecordingsPanel;
