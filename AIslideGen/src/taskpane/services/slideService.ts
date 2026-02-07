/**
 * Slide detection service for PowerPoint
 * Handles all Office.js API interactions for slide tracking and content extraction
 */

import { SlideInfo, SlideContent } from "../types/slide";

/**
 * Get information about the currently selected slide
 * @returns Promise resolving to SlideInfo with current index, total count, and slide ID
 */
export async function getCurrentSlideInfo(): Promise<SlideInfo> {
  return await PowerPoint.run(async (context) => {
    try {
      // Get the selected slides
      const selectedSlides = context.presentation.getSelectedSlides();
      const firstSlide = selectedSlides.getItemAt(0);

      // Get total slide count
      const allSlides = context.presentation.slides;
      allSlides.load("items");

      // Load slide ID for tracking
      firstSlide.load("id");

      await context.sync();

      // Find the index of the selected slide by comparing IDs
      const selectedId = firstSlide.id;
      let currentIndex = 0;

      for (let i = 0; i < allSlides.items.length; i++) {
        allSlides.items[i].load("id");
        await context.sync();

        if (allSlides.items[i].id === selectedId) {
          currentIndex = i;
          break;
        }
      }

      return {
        currentIndex,
        totalCount: allSlides.items.length,
        slideId: selectedId
      };
    } catch (error) {
      console.error("Error getting slide info:", error);
      throw new Error("Failed to get current slide information");
    }
  });
}

/**
 * Extract text content from the current slide
 * @returns Promise resolving to SlideContent with extracted text
 */
export async function getSlideContent(): Promise<SlideContent> {
  return await PowerPoint.run(async (context) => {
    try {
      // Get the slide (either by ID or currently selected)
      const slide = context.presentation.getSelectedSlides().getItemAt(0);
      const shapes = slide.shapes;
      shapes.load("items");

      await context.sync();

      const textContent: string[] = [];
      let title: string | null = null;

      // Iterate through all shapes and extract text
      for (const shape of shapes.items) {
        try {
          shape.load("type, name");
          await context.sync();

          // Try to get text from the shape
          shape.load("textFrame");
          await context.sync();

          const textFrame = shape.textFrame;
          textFrame.load("textRange");
          await context.sync();

          textFrame.textRange.load("text");
          await context.sync();

          const text = textFrame.textRange.text.trim();

          if (text) {
            // First text box is typically the title
            if (!title && shape.name.toLowerCase().includes("title")) {
              title = text;
            } else {
              textContent.push(text);
            }
          }
        } catch (error) {
          // Shape doesn't support textFrame (image, table, chart, etc.)
          // Silently skip - this is expected behavior
          continue;
        }
      }

      return {
        title,
        textContent,
        shapeCount: shapes.items.length
      };
    } catch (error) {
      console.error("Error extracting slide content:", error);
      throw new Error("Failed to extract slide content");
    }
  });
}

/**
 * Extract text content from all slides in the presentation
 * @returns Promise resolving to an array of SlideContent for each slide
 */
export async function getAllSlidesContent(): Promise<SlideContent[]> {
  return await PowerPoint.run(async (context) => {
    const allSlides = context.presentation.slides;
    allSlides.load("items");
    await context.sync();

    const results: SlideContent[] = [];

    for (const slide of allSlides.items) {
      const shapes = slide.shapes;
      shapes.load("items");
      await context.sync();

      const textContent: string[] = [];
      let title: string | null = null;

      for (const shape of shapes.items) {
        try {
          shape.load("type, name");
          await context.sync();
          shape.load("textFrame");
          await context.sync();
          const textFrame = shape.textFrame;
          textFrame.load("textRange");
          await context.sync();
          textFrame.textRange.load("text");
          await context.sync();

          const text = textFrame.textRange.text.trim();
          if (text) {
            if (!title && shape.name.toLowerCase().includes("title")) {
              title = text;
            } else {
              textContent.push(text);
            }
          }
        } catch {
          continue;
        }
      }

      results.push({ title, textContent, shapeCount: shapes.items.length });
    }

    return results;
  });
}

// Tracking state
let isTracking = false;
let trackingCallback: (() => void) | null = null;
let pollingInterval: NodeJS.Timeout | null = null;
let lastKnownSlideId: string | null = null;
let eventListenerRegistered = false;

/**
 * Start tracking slide changes
 * Attempts to use DocumentSelectionChanged event, falls back to polling
 * @param callback Function to call when slide changes
 * @param interval Polling interval in milliseconds (default: 2000)
 */
export function startTracking(callback: () => void, interval: number = 2000): void {
  if (isTracking) {
    console.warn("Tracking is already active");
    return;
  }

  isTracking = true;
  trackingCallback = callback;

  // Try to register event listener first
  try {
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      handleSlideChangeEvent,
      (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          console.log("Event listener registered successfully");
          eventListenerRegistered = true;
        } else {
          console.warn("Event listener failed, using polling fallback:", result.error);
          startPolling(interval);
        }
      }
    );
  } catch (error) {
    console.warn("Could not register event listener, using polling fallback:", error);
    startPolling(interval);
  }

  // Initialize lastKnownSlideId
  getCurrentSlideInfo().then(info => {
    lastKnownSlideId = info.slideId;
  }).catch(err => {
    console.error("Error initializing slide tracking:", err);
  });
}

/**
 * Stop tracking slide changes
 * Removes event listeners and stops polling
 */
export function stopTracking(): void {
  if (!isTracking) {
    return;
  }

  isTracking = false;
  trackingCallback = null;

  // Remove event listener if it was registered
  if (eventListenerRegistered) {
    try {
      Office.context.document.removeHandlerAsync(
        Office.EventType.DocumentSelectionChanged,
        { handler: handleSlideChangeEvent },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            console.log("Event listener removed successfully");
          }
        }
      );
      eventListenerRegistered = false;
    } catch (error) {
      console.error("Error removing event listener:", error);
    }
  }

  // Stop polling if active
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log("Polling stopped");
  }

  lastKnownSlideId = null;
}

/**
 * Event handler for DocumentSelectionChanged
 */
function handleSlideChangeEvent(): void {
  if (trackingCallback) {
    trackingCallback();
  }
}

/**
 * Start polling for slide changes
 * @param interval Polling interval in milliseconds
 */
function startPolling(interval: number): void {
  console.log(`Starting polling with ${interval}ms interval`);

  pollingInterval = setInterval(async () => {
    try {
      const info = await getCurrentSlideInfo();

      // Check if slide has changed
      if (info.slideId !== lastKnownSlideId) {
        lastKnownSlideId = info.slideId;

        if (trackingCallback) {
          trackingCallback();
        }
      }
    } catch (error) {
      console.error("Error during polling:", error);
    }
  }, interval);
}
