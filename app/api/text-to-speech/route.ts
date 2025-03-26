import { NextResponse } from "next/server";
import { OPENAI_VOICES } from "../../constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, voice = OPENAI_VOICES.alloy } = body;
    const apiKey = process.env.OPENAI_API_KEY;
    const url = "https://api.openai.com/v1/audio/speech";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const audioBlob = await response.blob();
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error in TTS API:", error);
    return NextResponse.json(
      {
        message: "Failed to generate speech",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
