import React, { useState, useEffect } from "react";
import useDebounce from "../hooks/useDebounce";

interface SpeedControlProps {
  speed: number;
  setSpeed: (speed: number) => void;
  isLoading: boolean;
}

const SpeedControl: React.FC<SpeedControlProps> = ({
  speed,
  setSpeed,
  isLoading,
}) => {
  const [localSpeed, setLocalSpeed] = useState(speed);
  const debouncedSpeed = useDebounce(localSpeed, 100);

  useEffect(() => {
    setSpeed(debouncedSpeed);
  }, [debouncedSpeed, setSpeed]);

  return (
    <div className="mt-4">
      <label className="block text-gray-700 mb-2">
        Speed: <span id="speedValue">{speed}</span>x
      </label>
      <input
        type="range"
        id="speedSlider"
        className="w-full"
        style={{
          background: "black",
          cursor: "pointer",
        }}
        min="0.5"
        max="2"
        step="0.1"
        value={localSpeed}
        onChange={(e) => setLocalSpeed(parseFloat(e.target.value))}
        disabled={isLoading}
      />
    </div>
  );
};

export default SpeedControl;
