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
  slides?: GeneratedSlide[]; // Slides generated with this message
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
  | "web_search_permission"
  | "image_analysis"
  | "image_followup"
  | "editing"
  | "edit_complete";

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

// ── Edit operation types ──

export type EditOperationType =
  | "change_title"
  | "replace_content"
  | "add_bullets"
  | "remove_bullets"
  | "restyle"
  | "rewrite"
  | "delete_slide";

export interface EditInstruction {
  operation: EditOperationType;
  /** Which shape to target: "title", "content", "sources", or "all" */
  target?: "title" | "content" | "sources" | "all";
  /** New text value for text operations */
  newText?: string;
  /** Bullets to add (for add_bullets) */
  bulletsToAdd?: string[];
  /** Bullet text to match and remove (for remove_bullets) */
  bulletsToRemove?: string[];
  /** Style changes (for restyle) */
  style?: {
    fontSize?: number;
    fontColor?: string;
    bold?: boolean;
    italic?: boolean;
    backgroundColor?: string;
  };
}

export interface EditResponse {
  instructions: EditInstruction[];
  summary: string;
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
