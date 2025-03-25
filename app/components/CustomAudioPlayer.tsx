import { Download, Pause, Play, Repeat, Volume2, VolumeX } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAudioStore } from "../store/audioStore";

interface CustomAudioPlayerProps {
  audioUrl: string;
  title?: string;
}

let cachedPlaybackRate: number = 1;
let cachedVolume: number = 1;
let cachedIsMuted: boolean = false;

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({
  title = "audio",
  audioUrl,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { currentPlayingId, setCurrentPlayingId } = useAudioStore();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(cachedVolume);
  const [isMuted, setIsMuted] = useState<boolean>(cachedIsMuted);
  const [playbackRate, setPlaybackRate] = useState<number>(cachedPlaybackRate);
  const [isRepeating, setIsRepeating] = useState<boolean>(false);

  // Memoized event handlers for audio element
  const setAudioData = useCallback(() => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      // Check if the duration is valid, NaN, or Infinity here
      if (
        !isNaN(audioDuration) &&
        isFinite(audioDuration) &&
        audioDuration > 0
      ) {
        setDuration(audioDuration);
      } else {
        // Set duration to 0 if invalid
        setDuration(0);
      }
    }
  }, []);

  // Add a separate event handler for the durationchange event
  const onDurationChange = useCallback(() => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (
        !isNaN(audioDuration) &&
        isFinite(audioDuration) &&
        audioDuration > 0
      ) {
        setDuration(audioDuration);
      } else {
        // Set duration to 0 if invalid
        setDuration(0);
      }
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

  const togglePlay = useCallback(
    (forcePlay?: boolean) => {
      if (!audioRef.current) {
        return;
      }

      const shouldPlay =
        typeof forcePlay === "boolean" ? forcePlay : !isPlaying;

      if (shouldPlay) {
        audioRef.current.play();
        setCurrentPlayingId(audioUrl);
      } else {
        audioRef.current.pause();
      }
      setIsPlaying(shouldPlay);
    },
    [audioUrl, isPlaying, setCurrentPlayingId]
  );

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleRepeat = useCallback(() => {
    setIsRepeating(!isRepeating);
  }, [isRepeating]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!audioRef.current) return;

      setVolume(value);
      audioRef.current.volume = value;
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
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${title}-${Date.now()}.mp3`;
    link.click();
  }, [audioUrl, title]);

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

  // Ensure audio is loading
  useEffect(() => {
    const loadAudio = () => {
      if (audioRef.current) {
        // Set preload attribute to ensure metadata loads
        audioRef.current.preload = "metadata";

        // Reload audio if needed
        if (audioRef.current.readyState === 0) {
          audioRef.current.load();
        }
      }
    };

    loadAudio();
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Add listener for durationchange
    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", onEnded);

    // Add listener for errors
    const handleError = (e: ErrorEvent) => {
      console.error("Audio error:", e);
    };

    audio.addEventListener("error", handleError);

    // Retry loading info if audio is ready
    if (audio.readyState >= 1) {
      onDurationChange();
    }

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl, setAudioData, setAudioTime, onEnded, onDurationChange]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
    cachedPlaybackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
      audioRef.current.loop = isRepeating;
    }

    cachedVolume = volume;
    cachedIsMuted = isMuted;
  }, [volume, isMuted, isRepeating]);

  useEffect(() => {
    if (currentPlayingId && currentPlayingId !== audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [currentPlayingId, audioUrl, isPlaying]);

  return (
    <div
      className="w-full max-w-xl p-4 bg-white rounded-xl transition-all"
      style={{
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        marginTop: "2px",
      }}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex flex-col gap-2">
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gray-500 transition-all"
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

        <div className="flex justify-between text-xs font-medium text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => togglePlay()}
              className="p-2 bg-gray-500 rounded-full text-white hover:bg-gray-600 transition-colors"
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
              className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
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
              className="w-16 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
            />
          </div>

          <button
            onClick={toggleRepeat}
            className={`p-2 text-gray-600 transition-colors ${
              isRepeating ? "text-blue-500" : ""
            }`}
            aria-label={isRepeating ? "Disable Repeat" : "Enable Repeat"}
          >
            <Repeat size={16} />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
            aria-label="Download Audio"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="flex justify-center items-center mt-2 gap-2">
        {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
          <button
            key={rate}
            onClick={() => handlePlaybackRateChange(rate)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              playbackRate === rate
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
