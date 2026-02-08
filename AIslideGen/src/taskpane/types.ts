export type Mode = "generate" | "summarize" | "compare" | "proscons" | "research";
export type Tone = "professional" | "casual" | "academic";

export interface GeneratedSlide {
  title: string;
  bullets: string[];
  sources?: string[];
}

export type ChatMessageRole = "assistant" | "user";

export interface ChatOption {
  label: string;
  value: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface ImageData {
  fileName: string;
  base64: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  text: string;
  options?: ChatOption[];
  allowOther?: boolean;
  timestamp: number;
  searchResults?: SearchResult[];
  image?: ImageData;
}

export type ConversationStep =
  | "initial"
  | "mode"
  | "slideCount"
  | "tone"
  | "anything_else"
  | "generating"
  | "complete"
  | "summarize_ask"
  | "summarize_generating"
  | "web_search_query"
  | "web_search_results"
  | "image_analysis"
  | "image_followup";

export interface ConversationState {
  step: ConversationStep;
  userPrompt: string;
  mode: Mode;
  slideCount: number;
  tone: Tone;
  additionalContext: string;
  messages: ChatMessage[];
  image?: ImageData;
}

export interface Conversation {
  id: string;
  title: string;
  state: ConversationState;
  slides: GeneratedSlide[];
  selectedValues: Record<string, string>;
  createdAt: number;
  documentId?: string; // Links conversation to specific PowerPoint file
}
