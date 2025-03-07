import toast from "react-hot-toast";
import { newsEndPoint } from "../constants";

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
    // Fetch news data function
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
