import { useState, useEffect } from "react";
import { fetchNewsData, NewsItem } from "../api";

const NEWS_DATA_CACHE_PREFIX = "newsData_";
const CACHE_EXPIRATION_TIME_MS = 10 * 60 * 1000; // 10 minutes

const useFetch = (
  key: string
): {
  data: NewsItem[] | null;
  isLoading: boolean;
  error: string | null;
} => {
  const [data, setData] = useState<NewsItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const localStorageKey = `${NEWS_DATA_CACHE_PREFIX}${key}`;
      const cachedData = localStorage.getItem(localStorageKey);

      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData) as NewsItem[];
          setData(parsedData);
          setIsLoading(false);
          return;
        } catch (parseError) {
          console.error("Error parsing cached data:", parseError);
          localStorage.removeItem(localStorageKey); // Remove invalid cache
        }
      }

      try {
        const newsData = await fetchNewsData();
        setData(newsData);
        localStorage.setItem(localStorageKey, JSON.stringify(newsData));

        // Set cache expiration (10 minutes)
        setTimeout(() => {
          localStorage.removeItem(localStorageKey);
        }, CACHE_EXPIRATION_TIME_MS);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setError(`Failed to load data. ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key]);

  return { data, isLoading, error };
};

export default useFetch;
