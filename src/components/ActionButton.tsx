import React, { useState } from "react";
import toast from "react-hot-toast";

interface ActionButtonProps {
  onClick: (toastId: string) => Promise<void>;
  icon: React.ReactNode;
  text: string;
  bgColor: string;
  hoverColor: string;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon,
  text,
  bgColor,
  hoverColor,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const toastId = toast.loading(`Processing ${text.toLowerCase()}...`);

    try {
      await onClick(toastId);
    } catch (error) {
      console.error(`Error in ${text} operation:`, error);
      toast.error(`Failed to ${text.toLowerCase()}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center px-3 py-1.5 ${bgColor} text-white rounded-md text-xs font-medium
                 ${hoverColor} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-50 focus:ring-blue-500
                 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md 
                 active:scale-95 ${className}`}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 mr-1.5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <span className="mr-1.5">{icon}</span>
      )}
      {text}
    </button>
  );
};

export default ActionButton;
