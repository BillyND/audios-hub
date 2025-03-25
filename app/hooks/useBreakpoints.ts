import { useState, useEffect } from "react";

/**
 * useBreakpoints - A custom hook to track responsive breakpoints.
 * @returns {object} - An object containing boolean values for 'isMobile', 'isTablet', 'isDesktop'.
 */
export const useBreakpoints = () => {
  const [breakpoints, setBreakpoints] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const calculateBreakpoints = () => {
      const width = window.innerWidth;
      setBreakpoints({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    window.addEventListener("resize", calculateBreakpoints);
    calculateBreakpoints(); // Initial calculation

    return () => window.removeEventListener("resize", calculateBreakpoints);
  }, []);

  return breakpoints;
};
