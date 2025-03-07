import React, { useState } from "react";
import {
  ClipboardDocumentIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import ActionButton from "./ActionButton";
import Modal from "./Modal";
import CustomAudioPlayer from "./CustomAudioPlayer";

interface NewsItem {
  title: string;
  images: string[];
  audio: string;
  url: string;
}

interface NewsRowProps {
  item: NewsItem;
  onCopyTitle: (toastId: string) => Promise<void>;
  onDownloadImages: (toastId: string) => Promise<void>;
  onDownloadAudio: (toastId: string) => Promise<void>;
  onDownloadAll: (toastId: string) => Promise<void>;
}

const NewsMediaRow: React.FC<NewsRowProps> = ({
  item,
  onCopyTitle,
  onDownloadImages,
  onDownloadAudio,
  onDownloadAll,
}) => {
  const truncateTitle = (title: string, maxLength: number = 80): string => {
    return title.length > maxLength
      ? `${title.substring(0, maxLength)}...`
      : title;
  };

  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [isLargeModal, setIsLargeModal] = useState<React.ReactNode>(null);

  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setModalOpen(true);
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors duration-150 group">
        <td
          className="px-4 py-3 border-b border-gray-200 whitespace-normal text-sm font-medium text-gray-900 cursor-pointer"
          onClick={() => {
            setIsLargeModal(true);
            openModal(<iframe src={item.url} className="w-full h-96" />);
          }}
        >
          <span className="group-hover:text-indigo-600 transition-colors">
            {truncateTitle(item.title)}
          </span>
        </td>
        <td className="px-4 py-3 border-b border-gray-200 whitespace-normal hidden sm:table-cell">
          <div className="flex flex-wrap gap-2">
            {item.images.map((image, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsLargeModal(true);
                  openModal(<img src={image} alt={`Image ${idx + 1}`} />);
                }}
                className="px-2 py-1 bg-gray-100 text-blue-600 hover:text-blue-800 hover:bg-gray-200 rounded text-xs break-all transition-colors flex items-center"
              >
                <PhotoIcon className="h-3 w-3 mr-1 inline-block" />
                {`Image ${idx + 1}`}
              </button>
            ))}
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200 whitespace-normal text-sm text-gray-900">
          <button
            onClick={() => {
              setIsLargeModal(false);
              openModal(<CustomAudioPlayer audioUrl={item.audio} />);
            }}
            className="px-2 py-1 bg-gray-100 text-blue-600 hover:text-blue-800 hover:bg-gray-200 rounded text-xs truncate break-all transition-colors flex items-center"
          >
            <SpeakerWaveIcon className="h-3 w-3 mr-1" />
            Audio
          </button>
        </td>
        <td className="px-4 py-3 border-b border-gray-200 whitespace-normal">
          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={(toastId) => onCopyTitle(toastId)}
              icon={<ClipboardDocumentIcon className="h-4 w-4" />}
              text="Copy"
              bgColor="bg-blue-700"
              hoverColor="hover:bg-slate-800"
            />
            <ActionButton
              onClick={(toastId) => onDownloadImages(toastId)}
              icon={<PhotoIcon className="h-4 w-4" />}
              text="Images"
              bgColor="bg-indigo-600"
              hoverColor="hover:bg-indigo-700"
              className="hidden sm:flex"
            />
            <ActionButton
              onClick={(toastId) => onDownloadAudio(toastId)}
              icon={<SpeakerWaveIcon className="h-4 w-4" />}
              text="Audio"
              bgColor="bg-purple-600"
              hoverColor="hover:bg-purple-700"
            />
            <ActionButton
              onClick={(toastId) => onDownloadAll(toastId)}
              icon={<ArrowDownTrayIcon className="h-4 w-4" />}
              text="All"
              bgColor="bg-red-600"
              hoverColor="hover:bg-emerald-700"
            />
          </div>
        </td>
      </tr>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        content={modalContent}
        size={isLargeModal ? "large" : "default"}
      />
    </>
  );
};

export default NewsMediaRow;
