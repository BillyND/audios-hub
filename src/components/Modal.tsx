import React, { useCallback, useEffect, useRef } from "react";

type ModalSize = "default" | "large";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: React.ReactNode;
  title?: string;
  size?: ModalSize;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  content,
  title = "",
  size = "default",
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const modalElement = document.querySelector(".modal-content");
      if (modalElement && !modalElement.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
    } else {
      document.body.style.overflow = ""; // Re-enable scrolling
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [handleClickOutside, isOpen]);

  // Determine size classes based on size prop
  const modalClasses =
    size === "large"
      ? "max-w-7xl w-auto md:w-auto"
      : "max-w-3xl w-11/12 md:w-auto";

  if (!isOpen) return null;

  // Detect if content is an image
  const isImage =
    React.isValidElement<{ children?: React.ReactNode }>(content) &&
    (content.type === "img" ||
      (content.type === "div" &&
        content.props.children &&
        React.isValidElement(content.props.children) &&
        content.props.children.type === "img"));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`${modalClasses} bg-white rounded-lg shadow-xl modal-content 
                     transform transition-all duration-300 ease-out
                     flex flex-col rounded-lg overflow-hidden`}
          style={
            size === "large"
              ? {
                  height: "calc(100vh - 32px)",
                  width: "calc(100vw - 32px)",
                }
              : {}
          }
        >
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-1 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content container */}
          <div
            ref={contentRef}
            className={`px-6 py-4 flex-1 ${
              size === "default" || (size === "large" && isImage)
                ? "overflow-y-auto"
                : "overflow-hidden"
            } ${
              size === "large" && isImage
                ? "flex items-center justify-center"
                : ""
            }`}
          >
            {size === "large" && React.isValidElement(content) ? (
              content.type === "iframe" ? (
                // Handle iframe content
                React.cloneElement(content as React.ReactElement, {
                  // @ts-expect-error ignore
                  style: {
                    ...((
                      content as React.ReactElement<{
                        style?: React.CSSProperties;
                      }>
                    )?.props?.style || {}),
                    height: "calc(100vh - 110px)",
                    width: "100%",
                    border: "none",
                  },
                  className: `${
                    // @ts-expect-error ignore
                    (content as React.ReactElement).props.className || ""
                  } w-full h-full`,
                })
              ) : isImage ? (
                // Handle image content - don't force 100% height, allow scrolling if needed
                <div className="max-h-full overflow-auto flex items-center justify-center">
                  {content}
                </div>
              ) : (
                // Handle other content types
                <div className="h-full">{content}</div>
              )
            ) : (
              // Default content handling
              content
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
