import { useState, useCallback, useMemo } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast, { Toaster } from "react-hot-toast";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Pagination from "./components/Pagination";
import NewsMediaRow from "./components/NewsMediaRow";
import NoNewsMediaState from "./components/NoNewsMediaState";
import useNewsMediaFetch from "./hooks/useFetch";
import { NewsItem } from "./api/newsApi";

import { ITEMS_PER_PAGE } from "./constants";

// Main App component
const NewsMediaDashboard: React.FC = () => {
  const { data: newsData, isLoading, error } = useNewsMediaFetch("news");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Handle pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return newsData ? newsData.slice(startIndex, endIndex) : [];
  }, [newsData, currentPage]);

  const totalPages = useMemo(
    () =>
      newsData ? Math.max(1, Math.ceil(newsData.length / ITEMS_PER_PAGE)) : 1,
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
                {newsData ? newsData.length : 0} items
              </span>
            </div>
          </div>
        </header>

        {newsData?.length === 0 ? (
          <NoNewsMediaState />
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
                  {paginatedData.map((item: NewsItem, index: number) => (
                    <NewsMediaRow
                      key={index}
                      item={item}
                      onCopyTitle={(toastId: string) =>
                        copyTitle(toastId, item.title)
                      }
                      onDownloadImages={(toastId: string) =>
                        downloadImages(toastId, item.images)
                      }
                      onDownloadAudio={(toastId: string) =>
                        downloadAudio(toastId, item.audio)
                      }
                      onDownloadAll={(toastId: string) =>
                        downloadAll(toastId, item)
                      }
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

export default NewsMediaDashboard;
