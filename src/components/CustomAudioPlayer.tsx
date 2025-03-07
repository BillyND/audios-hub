import { MoreHorizontal, Pause, Play, Volume2, VolumeX } from "lucide-react";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface CustomAudioPlayerProps {
  audioUrl: string;
}

const playbackRateMap: { [key: string]: number } = {};

// Context to manage the open/close state of settings popovers
interface SettingsContextProps {
  openSettingsId: string | null;
  setOpenSettingsId: (id: string | null) => void;
}

const SettingsContext = createContext<SettingsContextProps>({
  openSettingsId: null,
  setOpenSettingsId: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  return (
    <SettingsContext.Provider value={{ openSettingsId, setOpenSettingsId }}>
      {children}
    </SettingsContext.Provider>
  );
};

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ audioUrl }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(
    playbackRateMap[audioUrl] || 1
  ); // Initialize playbackRate state, retrieve from map
  const { openSettingsId, setOpenSettingsId } = useContext(SettingsContext);
  const playerId = useRef(Math.random().toString(36).substring(7)).current; // Generate a unique ID for each player
  const isSettingsOpen = openSettingsId === playerId;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlers = {
      setAudioData: () => setDuration(audio.duration),
      setAudioTime: () => setCurrentTime(audio.currentTime),
      onEnded: () => {
        setIsPlaying(false);
        setCurrentTime(0);
      },
    };

    // Add event listeners
    audio.addEventListener("loadedmetadata", handlers.setAudioData);
    audio.addEventListener("timeupdate", handlers.setAudioTime);
    audio.addEventListener("ended", handlers.onEnded);

    // Clean up event listeners
    return () => {
      audio.removeEventListener("loadedmetadata", handlers.setAudioData);
      audio.removeEventListener("timeupdate", handlers.setAudioTime);
      audio.removeEventListener("ended", handlers.onEnded);
    };
  }, [audioUrl]); // audioUrl as dependency to reload metadata when audioUrl changes

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      playbackRateMap[audioUrl] = playbackRate; // Store playback rate in map
    }
  }, [playbackRate, audioUrl]);

  // Effect to close the settings popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSettingsOpen &&
        !(event.target as HTMLElement).closest("#settings-popover") &&
        !(event.target as HTMLElement).closest("#settings-button")
      ) {
        setOpenSettingsId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen, setOpenSettingsId]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!audioRef.current) return;

    setVolume(value);
    audioRef.current.volume = value;

    if (value === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
      audioRef.current.muted = false;
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!audioRef.current) return;

    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!audioRef.current) return;

    setPlaybackRate(rate);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return "00:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress percentage for progress bar styling
  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  const toggleSettings = () => {
    setOpenSettingsId(isSettingsOpen ? null : playerId);
  };

  return (
    <div
      className="w-full max-w-xl p-4 bg-white rounded-xl dark:bg-gray-800 transition-all"
      style={{
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        margin: "2px",
      }}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Player controls */}
      <div className="flex flex-col gap-2">
        {/* Progress bar with custom styling */}
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

        {/* Time display */}
        <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Primary controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause button */}
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

            {/* Volume controls */}
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

          {/* Settings Icon with Popover */}
          <div className="relative">
            <button
              id="settings-button"
              onClick={toggleSettings}
              className="p-2 text-gray-600 hover:text-blue-500 transition-colors dark:text-gray-300 dark:hover:text-blue-400"
              aria-label="Settings"
            >
              <MoreHorizontal size={18} />
            </button>

            {isSettingsOpen && (
              <div
                id="settings-popover"
                className="absolute right-0 bottom-full mb-2 w-32 bg-white rounded-md shadow-lg dark:bg-gray-700 z-5"
                style={{ boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)" }}
              >
                <div className="py-1">
                  {[0.5, 1, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        handlePlaybackRateChange(rate);
                        setOpenSettingsId(null); // Close popover after selection
                      }}
                      className={`block px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 w-full text-left ${
                        rate === playbackRate
                          ? "bg-gray-200 dark:bg-gray-600"
                          : ""
                      }`}
                      aria-label={`Set playback speed to ${rate}x`}
                    >
                      Speed {rate}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAudioPlayer;
