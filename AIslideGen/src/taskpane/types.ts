export type Mode = "generate" | "summarize" | "compare" | "proscons" | "research";
export type Tone = "professional" | "casual" | "academic";

export interface GeneratedSlide {
  title: string;
  bullets: string[];
}

export type ChatMessageRole = "assistant" | "user";

export interface ChatOption {
  label: string;
  value: string;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  text: string;
  options?: ChatOption[];
  allowOther?: boolean;
  timestamp: number;
}

export type ConversationStep =
  | "initial"
  | "mode"
  | "slideCount"
  | "tone"
  | "anything_else"
  | "generating"
  | "complete";

export interface ConversationState {
  step: ConversationStep;
  userPrompt: string;
  mode: Mode;
  slideCount: number;
  tone: Tone;
  additionalContext: string;
  messages: ChatMessage[];
}
