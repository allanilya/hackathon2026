/**
 * React hook for slide detection
 * Manages slide tracking state and integrates with slideService
 */

import { useState, useEffect, useCallback } from "react";
import { SlideDetectionOptions, SlideDetectionState } from "../types/slide";
import * as slideService from "../services/slideService";

/**
 * Hook for detecting and tracking the currently selected slide
 * @param options Configuration options (enabled, loadContent, etc.)
 * @returns Slide detection state and refresh function
 */
export function useSlideDetection(options: SlideDetectionOptions): SlideDetectionState {
  const { enabled, loadContent = false, pollingInterval = 2000 } = options;

  const [currentSlide, setCurrentSlide] = useState<number | null>(null);
  const [totalSlides, setTotalSlides] = useState<number | null>(null);
  const [slideContent, setSlideContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch current slide information
   */
  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const info = await slideService.getCurrentSlideInfo();

      // Convert 0-based index to 1-based for display
      setCurrentSlide(info.currentIndex + 1);
      setTotalSlides(info.totalCount);

      // Optionally load slide content
      if (loadContent) {
        const content = await slideService.getSlideContent();
        setSlideContent(content);
      }
    } catch (err) {
      console.error("Error fetching slide info:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, loadContent]);

  /**
   * Effect to manage tracking based on enabled state
   */
  useEffect(() => {
    if (!enabled) {
      // When disabled, clear state and stop tracking
      slideService.stopTracking();
      setCurrentSlide(null);
      setTotalSlides(null);
      setSlideContent(null);
      setError(null);
      return undefined;
    }

    // When enabled, start tracking
    // Initial load
    refresh();

    // Start tracking slide changes
    slideService.startTracking(refresh, pollingInterval);

    // Cleanup on unmount or when disabled
    return () => {
      slideService.stopTracking();
    };
  }, [enabled, refresh, pollingInterval]);

  return {
    currentSlide,
    totalSlides,
    slideContent,
    isLoading,
    error,
    refresh
  };
}
