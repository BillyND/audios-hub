import toast from "react-hot-toast";

// Constants
const CACHE_KEY = "newsData";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Types
interface NewsItem {
  title: string;
  images: string[];
  audio: string;
  url: string;
}

interface CachedData {
  data: NewsItem[];
  timestamp: number;
}

// Fetch news data function
export const fetchNewsData = async (): Promise<NewsItem[]> => {
  try {
    // Try to get data from cache first
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (cachedData) {
      const parsedCache = JSON.parse(cachedData) as CachedData;
      const now = Date.now();

      // If cache is still valid (within 1 hour)
      if (now - parsedCache.timestamp < CACHE_DURATION) {
        return parsedCache.data;
      }
    }

    // If no valid cache, fetch from API
    const newsEndPoint = import.meta.env.VITE_NEWS_END_POINT as string;
    if (!newsEndPoint) {
      throw new Error("NEWS_END_POINT is not defined in environment variables");
    }

    const response = await fetch(newsEndPoint);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = (await response.json()) as NewsItem[];

    // Save to cache
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );

    return data;
  } catch (error) {
    console.error("Error fetching news:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    toast.error("Failed to load news data");
    throw new Error(`Failed to load news data. ${errorMessage}`);
  }
};
