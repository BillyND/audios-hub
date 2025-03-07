import toast from "react-hot-toast";

// Types
export interface NewsItem {
  title: string;
  images: string[];
  audio: string;
  url: string;
}

// Fetch news data function
export const fetchNewsData = async (): Promise<NewsItem[]> => {
  try {
    // Fetch from API
    const newsEndPoint = import.meta.env.VITE_NEWS_END_POINT as string;
    if (!newsEndPoint) {
      throw new Error("NEWS_END_POINT is not defined in environment variables");
    }

    const response = await fetch(newsEndPoint);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = (await response.json()) as NewsItem[];

    return data;
  } catch (error) {
    console.error("Error fetching news:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    toast.error("Failed to load news data");
    throw new Error(`Failed to load news data. ${errorMessage}`);
  }
};
