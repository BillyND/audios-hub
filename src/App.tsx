import { useState, useEffect, useCallback, useMemo } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import Modal from "./components/Modal";
import "./App.css";

// Constants
const CACHE_KEY = "newsData";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const ITEMS_PER_PAGE = 10;

// Types
interface NewsItem {
  title: string;
  images: string[];
  audio: string;
  url: string; // Assume URL exists in the data
}

interface CachedData {
  data: NewsItem[];
  timestamp: number;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface ActionButtonProps {
  onClick: (toastId: string) => Promise<void>;
  icon: React.ReactNode;
  text: string;
  bgColor: string;
  hoverColor: string;
  className?: string;
}

interface NewsRowProps {
  item: NewsItem;
  onCopyTitle: (toastId: string) => Promise<void>;
  onDownloadImages: (toastId: string) => Promise<void>;
  onDownloadAudio: (toastId: string) => Promise<void>;
  onDownloadAll: (toastId: string) => Promise<void>;
}

// Component for pagination controls - Modern style
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Generate page numbers to show (show 5 pages at a time with current in middle if possible)
  const getPageNumbers = () => {
    // For small number of pages, show all
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // For many pages, show context around current page
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    // Adjust if we're near the end
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - 4);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-center mt-8 space-x-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-md transition-colors ${
            currentPage === page
              ? "bg-indigo-600 text-white font-medium"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </nav>
  );
};

// Component for action buttons - Premium style
const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon,
  text,
  bgColor,
  hoverColor,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const toastId = toast.loading(`Processing ${text.toLowerCase()}...`);

    try {
      await onClick(toastId);
    } catch (error) {
      console.error(`Error in ${text} operation:`, error);
      toast.error(`Failed to ${text.toLowerCase()}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center px-3 py-1.5 ${bgColor} text-white rounded-md text-xs font-medium
                 ${hoverColor} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-50 focus:ring-blue-500
                 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md 
                 active:scale-95 ${className}`}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 mr-1.5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <span className="mr-1.5">{icon}</span>
      )}
      {text}
    </button>
  );
};

// Component for news rows - Premium style
const NewsRow: React.FC<NewsRowProps> = ({
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
              openModal(<audio controls src={item.audio} />);
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

// Empty State component
const EmptyState: React.FC = () => (
  <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
    <ExclamationCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No news data available
    </h3>
    <p className="text-gray-500 mb-6">
      There are no news items to display at this time.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
    >
      Refresh Data
    </button>
  </div>
);

// Main App component
const App: React.FC = () => {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Check cache and fetch data
  useEffect(() => {
    const fetchNewsData = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to get data from cache first
        const cachedData = localStorage.getItem(CACHE_KEY);

        if (cachedData) {
          const parsedCache = JSON.parse(cachedData) as CachedData;
          const now = Date.now();

          // If cache is still valid (within 1 hour)
          if (now - parsedCache.timestamp < CACHE_DURATION) {
            setNewsData(parsedCache.data);
            setIsLoading(false);
            return;
          }
        }

        // If no valid cache, fetch from API
        const newsEndPoint = import.meta.env.VITE_NEWS_END_POINT as string;
        if (!newsEndPoint) {
          throw new Error(
            "NEWS_END_POINT is not defined in environment variables"
          );
        }

        const response = await fetch(newsEndPoint);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = (await response.json()) as NewsItem[];

        // Save to state and cache
        setNewsData(data);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error("Error fetching news:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setError(`Failed to load news data. ${errorMessage}`);
        toast.error("Failed to load news data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewsData();
  }, []);

  // Handle pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return newsData.slice(startIndex, endIndex);
  }, [newsData, currentPage]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(newsData.length / ITEMS_PER_PAGE)),
    [newsData]
  );

  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
    // Note: Removed scroll to top as requested
  };

  // Copy title function
  const copyTitle = useCallback(
    async (toastId: string, title: string): Promise<void> => {
      try {
        await navigator.clipboard.writeText(title);
        toast.success("Title copied to clipboard!", { id: toastId });
      } catch (error) {
        console.error("Failed to copy: ", error);
        throw new Error("Failed to copy title");
      }
    },
    []
  );

  // Improved download function
  const downloadSingleFile = useCallback(
    async (url: string, filename: string): Promise<void> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filename}`);
        }

        const blob = await response.blob();
        saveAs(blob, filename);
        return Promise.resolve();
      } catch (error) {
        console.error(`Error downloading ${filename}:`, error);
        throw error;
      }
    },
    []
  );

  // Download images function
  const downloadImages = useCallback(
    async (toastId: string, images: string[]): Promise<void> => {
      if (images.length === 0) {
        toast.error("No images to download", { id: toastId });
        return;
      }

      try {
        for (let i = 0; i < images.length; i++) {
          // Update toast with progress
          toast.loading(`Downloading image ${i + 1} of ${images.length}...`, {
            id: toastId,
          });

          // Download each image
          await downloadSingleFile(images[i], `image-${i + 1}.jpg`);
        }

        toast.success(`Downloaded ${images.length} images successfully`, {
          id: toastId,
        });
      } catch (error) {
        console.error("Error downloading images:", error);
        throw new Error("Failed to download images");
      }
    },
    [downloadSingleFile]
  );

  // Download audio function
  const downloadAudio = useCallback(
    async (toastId: string, audio: string): Promise<void> => {
      try {
        await downloadSingleFile(audio, "audio.m4a");
        toast.success("Audio downloaded successfully!", { id: toastId });
      } catch (error) {
        console.error("Error downloading audio:", error);
        throw new Error("Failed to download audio");
      }
    },
    [downloadSingleFile]
  );

  // Download all function
  const downloadAll = useCallback(
    async (toastId: string, item: NewsItem): Promise<void> => {
      try {
        const zip = new JSZip();
        const folder = zip.folder(item.title) || zip;

        // Function to add a file to the zip
        const addFileToZip = async (
          url: string,
          filename: string
        ): Promise<void> => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${filename}`);
          }
          const blob = await response.blob();
          folder.file(filename, blob);
        };

        // Add images to zip with progress updates
        for (let i = 0; i < item.images.length; i++) {
          toast.loading(
            `Adding image ${i + 1} of ${item.images.length} to package...`,
            { id: toastId }
          );
          await addFileToZip(item.images[i], `image-${i + 1}.jpg`);
        }

        // Add audio to zip
        toast.loading("Adding audio to package...", { id: toastId });
        await addFileToZip(item.audio, "audio.m4a");

        // Generate zip content
        toast.loading("Preparing download...", { id: toastId });
        const content = await zip.generateAsync({ type: "blob" });

        // Save the zip file
        saveAs(content, `${item.title}.zip`);

        // Copy title to clipboard
        await navigator.clipboard.writeText(item.title);

        // Show success message
        toast.success("All assets downloaded and title copied!", {
          id: toastId,
        });
      } catch (error) {
        console.error("Error in downloadAll:", error);
        throw new Error("Failed to download all assets");
      }
    },
    []
  );

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-gray-700 font-medium">
          Loading news data...
        </p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="bg-white border-l-4 border-red-500 text-gray-800 p-6 rounded-lg shadow-md">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-600 mb-2">
            Error Loading Data
          </h3>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-4 py-8 max-w-6xl">
        {/* Toast container with limits based on device */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              color: "#333",
              borderRadius: "8px",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              padding: "16px",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#fff",
              },
              style: {
                borderLeft: "4px solid #10B981",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
              style: {
                borderLeft: "4px solid #EF4444",
              },
            },
            loading: {
              style: {
                borderLeft: "4px solid #3B82F6",
              },
            },
          }}
          // Limit the number of toasts based on device
          containerStyle={{
            top: 20,
            right: 20,
          }}
          containerClassName="toast-container"
          // Use 1 toast for mobile, 3 for desktop
          gutter={8}
        />

        <header className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                News Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Browse, download and manage news content
              </p>
            </div>
            <div className="hidden md:block">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {newsData.length} items
              </span>
            </div>
          </div>
        </header>

        {newsData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Images
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audio
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <NewsRow
                      key={index}
                      item={item}
                      onCopyTitle={(toastId) => copyTitle(toastId, item.title)}
                      onDownloadImages={(toastId) =>
                        downloadImages(toastId, item.images)
                      }
                      onDownloadAudio={(toastId) =>
                        downloadAudio(toastId, item.audio)
                      }
                      onDownloadAll={(toastId) => downloadAll(toastId, item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Only show pagination if more than one page */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-1">
            © {new Date().getFullYear()} News Dashboard | Premium Version
          </p>
          <p className="text-xs text-gray-400">Data refreshes every hour</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
