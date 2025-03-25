import toast from "react-hot-toast";
import { baseEndPoint } from "../constants";

export const fetchTTSData = async (
  text: string,
  voice: string,
  speed: number,
  optimizeAI: boolean
) => {
  const ttsEndPoint = `${baseEndPoint}/tts`;

  try {
    const response = await fetch(ttsEndPoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        language: voice,
        speed: String(speed),
        isOptimizeWithAI: optimizeAI,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Error fetching TTS:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    toast.error("Failed to generate speech");
    throw new Error(`Failed to generate speech. ${errorMessage}`);
  }
};
