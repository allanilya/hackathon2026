/**
 * Slide detection type definitions for AIslideGen
 */

/**
 * Information about the currently selected slide
 */
export interface SlideInfo {
  /** 0-based index of the current slide */
  currentIndex: number;
  /** Total number of slides in the presentation */
  totalCount: number;
  /** Unique identifier for the selected slide */
  slideId: string;
}

/**
 * Extracted content from a slide
 */
export interface SlideContent {
  /** Slide title (if found) */
  title: string | null;
  /** Array of text content from shapes */
  textContent: string[];
  /** Total number of shapes on the slide */
  shapeCount: number;
}

/**
 * Options for slide detection behavior
 */
export interface SlideDetectionOptions {
  /** Whether to enable tracking (controlled by toggle) */
  enabled: boolean;
  /** Whether to load slide content automatically */
  loadContent?: boolean;
  /** Polling interval in milliseconds (default: 2000) */
  pollingInterval?: number;
  /** Whether to attempt event listener first (default: true) */
  enableEventListener?: boolean;
}

/**
 * State returned by useSlideDetection hook
 */
export interface SlideDetectionState {
  /** Current slide number (1-based for display) */
  currentSlide: number | null;
  /** Total number of slides */
  totalSlides: number | null;
  /** Extracted slide content (if requested) */
  slideContent: SlideContent | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Manual refresh function */
  refresh: () => Promise<void>;
}
