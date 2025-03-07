import { useState, useEffect, useCallback } from "react";
import { fetchNewsData, NewsItem } from "../api/newsApi";
import cacheService from "../services/cacheService";

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch and cache news data
 * @param key - Cache key for the data
 * @param options - Optional configuration
 */
const useNewsMediaFetch = (
  key: string,
  options?: {
    skipCache?: boolean;
    ttl?: number;
  }
): FetchState<NewsItem[]> & {
  refresh: () => Promise<void>;
} => {
  const [state, setState] = useState<FetchState<NewsItem[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  // Extract fetch logic to a separate function that can be called both
  // in useEffect and from the refresh function
  const fetchData = useCallback(
    async (skipCache = options?.skipCache || false) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Try to get data from cache if not skipping cache
      if (!skipCache) {
        const cachedData = cacheService.get<NewsItem[]>(key);
        if (cachedData) {
          setState({
            data: cachedData.data,
            isLoading: false,
            error: null,
          });
          return;
        }
      }

      // Fetch fresh data from API
      try {
        const newsData = await fetchNewsData();

        // Cache the fetched data
        cacheService.set(key, newsData);

        setState({
          data: newsData,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Failed to load data. ${errorMessage}`,
        }));
      }
    },
    [key, options?.skipCache]
  );

  // Public refresh function to manually refetch data
  const refresh = useCallback(async () => {
    await fetchData(true); // Skip cache when manually refreshing
  }, [fetchData]);

  // Fetch data on mount or when key changes
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Only set state if component is still mounted
      if (!isMounted) return;
      await fetchData();
    };

    loadData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [key, fetchData]);

  return { ...state, refresh };
};

export default useNewsMediaFetch;
