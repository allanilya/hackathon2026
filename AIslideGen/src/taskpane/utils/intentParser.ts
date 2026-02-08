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

/**
 * Detects if the user's query is about current events or recent information
 * that would benefit from web search.
 */
export function detectsCurrentEvents(text: string): boolean {
  const lowerText = text.toLowerCase();
  const temporal = /\b(latest|recent|current|today|this week|2024|2025|2026|now|happening|breaking|news|developments)\b/i;
  const questions = /\b(what's happening|what's going on|what are the latest)\b/i;
  const data = /\b(current statistics|latest data|recent trends|breaking news)\b/i;
  return temporal.test(lowerText) || questions.test(lowerText) || data.test(lowerText);
}

/**
 * Extracts URLs from user query
 */
export function extractUrl(text: string): string | null {
  // Match http(s) URLs
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : null;
}

/**
 * Detects if user provided a specific URL to fetch/summarize
 */
export function hasProvidedUrl(text: string): boolean {
  return extractUrl(text) !== null;
}

/**
 * Detects if the message is a greeting
 */
export function isGreeting(text: string): boolean {
  const lowerText = text.toLowerCase().trim();
  const greetings = /^(hi|hey|hello|sup|yo|greetings|good morning|good afternoon|good evening|howdy)[\s!?.]*$/i;
  return greetings.test(lowerText);
}

/**
 * Detects if the message is a question (not a request to create slides)
 */
export function isQuestion(text: string): boolean {
  const lowerText = text.toLowerCase().trim();
  // Questions that are NOT slide generation requests
  const questionWords = /^(what|who|where|when|why|how|can|could|would|should|is|are|do|does|did)/i;
  const hasQuestionMark = text.includes("?");

  // But exclude slide generation questions like "can you create slides about..."
  const isSlideRequest = /\b(create|generate|make|build|give me|show me)\b.*\b(slide|presentation|deck)\b/i.test(lowerText);

  return (questionWords.test(lowerText) || hasQuestionMark) && !isSlideRequest;
}

/**
 * Detects if the message is a request to edit an existing slide.
 * Must be checked BEFORE isSlideRequest since "change the slide title" is an edit, not creation.
 */
export function isEditRequest(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Edit verbs + slide/content targets
  const editVerbs = /\b(edit|change|modify|update|fix|replace|remove|delete|restyle|rewrite|revise|tweak|adjust|rephrase)\b/;
  const slideTargets = /\b(slide|title|bullet|content|text|heading|point|background|font|color|style|this slide|current slide)\b/;

  if (editVerbs.test(lowerText) && slideTargets.test(lowerText)) {
    return true;
  }

  // "make the title...", "make it more...", "make the text..."
  if (/\bmake\s+(the\s+)?(title|bullet|content|text|slide|it)\b/.test(lowerText)) {
    return true;
  }

  // "delete this slide", "remove slide 3"
  if (/\b(delete|remove)\s+(this\s+)?slide\b/.test(lowerText)) {
    return true;
  }

  // "add a bullet about...", "add more points"
  if (/\badd\s+(a\s+)?(bullet|point|item)\b/.test(lowerText)) {
    return true;
  }

  return false;
}

/**
 * Parse the edit request to determine which slide to target
 */
export function parseEditTarget(text: string): { scope: "current" | "specific"; slideNumber?: number } {
  const lowerText = text.toLowerCase();

  // Check for specific slide number: "slide 3", "slide number 5"
  const slideNumMatch = lowerText.match(/slide\s+(?:number\s+)?(\d+)/);
  if (slideNumMatch) {
    return { scope: "specific", slideNumber: parseInt(slideNumMatch[1], 10) };
  }

  // Default: current slide
  return { scope: "current" };
}

/**
 * Detects if the message is clearly a slide generation request
 */
export function isSlideRequest(text: string): boolean {
  const lowerText = text.toLowerCase();
  const requestPatterns = /\b(create|generate|make|build|give me|show me|i want|i need)\b.*\b(slide|presentation|deck)\b/i;
  const hasSlideCount = /\b(\d+|a|one|two|three|four|five|six|seven|eight|nine|ten)\s+slide/i.test(lowerText);
  return requestPatterns.test(lowerText) || hasSlideCount;
}
