import React from "react";
import CustomAudioPlayer from "./CustomAudioPlayer";

interface AudioPlayerProps {
  audioUrl: string | null;
  isLoading: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, isLoading }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Current Audio</h3>
      {isLoading ? (
        <div className="flex justify-center mt-2 h-10">
          <div className="loader"></div>
        </div>
      ) : (
        <div id="audioContainer" className="w-full">
          {audioUrl && <CustomAudioPlayer audioUrl={audioUrl} />}
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
