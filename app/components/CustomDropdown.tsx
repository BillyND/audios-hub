import React, { useState, useRef, useEffect } from "react";

interface CustomDropdownProps {
  options: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  id?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  error,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "Escape":
        setIsOpen(false);
        break;
      case "Enter":
      case " ":
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      default:
        break;
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (key: string) => {
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        id={id}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full p-3 rounded-md transition flex justify-between items-center ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "text-gray-900 hover:border-gray-400 focus:ring-gray-600 focus:border-gray-700"
        } ${
          error
            ? "border border-red-500"
            : "border border-gray-300 focus:outline-none"
        }`}
      >
        <span className="truncate">{options[value] || placeholder}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {error && <p className="mt-1 text-sm text-rose-500">{error}</p>}

      {isOpen && (
        <ul
          role="listbox"
          aria-activedescendant={value}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {Object.entries(options).length > 0 ? (
            Object.entries(options).map(([key, label]) => (
              <li
                key={key}
                id={key}
                role="option"
                aria-selected={value === key}
                onClick={() => handleSelect(key)}
                className={`p-3 cursor-pointer ${
                  value === key
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "hover:bg-gray-50"
                }`}
              >
                {label}
              </li>
            ))
          ) : (
            <li className="p-3 text-gray-500">No options available</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
