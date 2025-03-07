export const ITEMS_PER_PAGE = 10;

export const CACHE_CONFIG = {
  PREFIX: "newsData_",
  TTL: 10 * 60 * 1000, // 10 minutes in milliseconds
};

export const newsEndPoint = import.meta.env.VITE_NEWS_END_POINT as string;
