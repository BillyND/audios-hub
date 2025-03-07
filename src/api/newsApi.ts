import toast from "react-hot-toast";
import { newsEndPoint } from "../constants";

// Types
export interface NewsItem {
  title: string;
  images: string[];
  audio: string;
  url: string;
}

let pendingRequest: Promise<NewsItem[]> | null = null;

// Fetch news data function
export const fetchNewsData = async (): Promise<NewsItem[]> => {
  if (pendingRequest) {
    // If a request is already in progress, return the existing promise
    return pendingRequest;
  }

  try {
    // Fetch news data function
    pendingRequest = fetch(newsEndPoint)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json() as Promise<NewsItem[]>;
      })
      .finally(() => {
        // Clear the pendingRequest when the request is complete (success or failure)
        pendingRequest = null;
      });

    const data = await pendingRequest;
    return data;
  } catch (error) {
    console.error("Error fetching news:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    toast.error("Failed to load news data");
    throw new Error(`Failed to load news data. ${errorMessage}`);
  } finally {
    // Ensure pendingRequest is cleared even if an error occurs before the .finally block above
    if (pendingRequest) {
      pendingRequest = null;
    }
  }
};
