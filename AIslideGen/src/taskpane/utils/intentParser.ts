/**
 * Intent parsing utilities for smart conversation flow
 * Extracts user intent from initial message to skip unnecessary questions
 */

import type { Mode, Tone } from "../types";

export interface ParsedIntent {
  slideCount?: number;
  mode?: Mode;
  tone?: Tone;
  topic: string;
  hasAllInfo: boolean;
}

/**
 * Parse slide count from user message
 * Examples: "a slide", "1 slide", "3 slides", "five slides"
 */
function parseSlideCount(text: string): number | undefined {
  const lowerText = text.toLowerCase();

  // Check for "a slide" or "one slide"
  if (/\ba\s+slide\b/.test(lowerText) || /\bone\s+slide\b/.test(lowerText)) {
    return 1;
  }

  // Check for number + "slide(s)"
  const numberMatch = lowerText.match(/(\d+)\s+slides?/);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }

  // Check for written numbers
  const writtenNumbers: Record<string, number> = {
    two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };

  for (const [word, num] of Object.entries(writtenNumbers)) {
    if (new RegExp(`\\b${word}\\s+slides?\\b`).test(lowerText)) {
      return num;
    }
  }

  return undefined;
}

/**
 * Detect mode from keywords in user message
 */
function parseMode(text: string): Mode | undefined {
  const lowerText = text.toLowerCase();

  if (/\b(summarize|summary|condense|brief)\b/.test(lowerText)) {
    return "summarize";
  }

  if (/\b(compare|comparison|versus|vs\.?|difference)\b/.test(lowerText)) {
    return "compare";
  }

  if (/\b(pros?\s+and\s+cons?|advantages?\s+and\s+disadvantages?)\b/.test(lowerText)) {
    return "proscons";
  }

  if (/\b(research|investigate|analyze|analysis|study|current|latest|recent|what's happening|situation|developments|news|updates)\b/.test(lowerText)) {
    return "research";
  }

  // Default to generate if no specific mode detected
  return "generate";
}

/**
 * Detect tone from keywords in user message
 */
function parseTone(text: string): Tone | undefined {
  const lowerText = text.toLowerCase();

  if (/\b(casual|informal|friendly|conversational|relaxed)\b/.test(lowerText)) {
    return "casual";
  }

  if (/\b(academic|scholarly|formal|technical|scientific)\b/.test(lowerText)) {
    return "academic";
  }

  if (/\b(professional|business)\b/.test(lowerText)) {
    return "professional";
  }

  return undefined;
}

/**
 * Extract the main topic by removing detected metadata
 */
function extractTopic(text: string, tone?: Tone): string {
  let topic = text;

  // Remove slide count phrases
  topic = topic.replace(/\b(a|one|\d+|two|three|four|five|six|seven|eight|nine|ten)\s+slides?\b/gi, '');

  // Remove tone keywords
  if (tone) {
    topic = topic.replace(new RegExp(`\\b${tone}\\b`, 'gi'), '');
  }

  // Remove common fluff words at the start
  topic = topic.replace(/^(send me|make me|create|generate|give me|show me|i want|i need)\s+/i, '');
  topic = topic.replace(/\babout\s+/i, '');

  return topic.trim();
}

/**
 * Main intent parsing function
 * Analyzes user message and extracts all available information
 */
export function parseUserIntent(message: string): ParsedIntent {
  const slideCount = parseSlideCount(message);
  const mode = parseMode(message);
  const tone = parseTone(message);
  const topic = extractTopic(message, tone);

  // Determine if we have enough info to skip questions
  // We need at least a topic
  const hasAllInfo = topic.length > 0 && topic.length > 3;

  return {
    slideCount,
    mode,
    tone,
    topic,
    hasAllInfo
  };
}
