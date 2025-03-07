import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

interface CustomAudioPlayerProps {
  audioUrl: string;
}

let cachedPlaybackRate: number = 1;
let cachedVolume: number = 1;
let cachedIsMuted: boolean = false;

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ audioUrl }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(cachedVolume);
  const [isMuted, setIsMuted] = useState<boolean>(cachedIsMuted);
  const [playbackRate, setPlaybackRate] = useState<number>(cachedPlaybackRate);

  // Memoized event handlers for audio element
  const setAudioData = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const setAudioTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl, setAudioData, setAudioTime, onEnded]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
    cachedPlaybackRate = playbackRate;
  }, [playbackRate, audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
    cachedVolume = volume;
    cachedIsMuted = isMuted;
  }, [volume, isMuted, audioUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!audioRef.current) return;

      setVolume(value);
      setIsMuted(value === 0);
    },
    []
  );

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!audioRef.current) return;

      audioRef.current.currentTime = value;
      setCurrentTime(value);
    },
    []
  );

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (!audioRef.current) return;
    setPlaybackRate(rate);
  }, []);

  const formatTime = useCallback((time: number): string => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const progressPercentage = useMemo(() => {
    return duration ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  return (
    <div
      className="w-full max-w-xl p-4 bg-white rounded-xl dark:bg-gray-800 transition-all"
      style={{
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        margin: "2px",
      }}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex flex-col gap-2">
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
          <div
            className="absolute h-full bg-gray-500 dark:bg-gray-400 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
          <input
            type="range"
            className="absolute w-full h-full opacity-0 cursor-pointer"
            min="0"
            max={duration || 0}
            step="0.01"
            value={currentTime}
            onChange={handleProgressChange}
          />
        </div>

        <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 bg-gray-500 rounded-full text-white hover:bg-gray-600 transition-colors dark:bg-gray-600 dark:hover:bg-gray-500"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} className="ml-0.5" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 text-gray-600 hover:text-blue-500 transition-colors dark:text-gray-300 dark:hover:text-blue-400"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={16} />
              ) : (
                <Volume2 size={16} />
              )}
            </button>
            <input
              type="range"
              className="w-16 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer dark:bg-gray-700"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
            />
          </div>

          <div className="relative"></div>
        </div>
      </div>
      <div className="flex justify-center items-center mt-2 gap-2">
        {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
          <button
            key={rate}
            onClick={() => handlePlaybackRateChange(rate)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              playbackRate === rate
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
            aria-label={`Set playback speed to ${rate}x`}
          >
            {rate}x
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomAudioPlayer;
