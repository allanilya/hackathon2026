import type { ChatOption } from "./types";

export interface QuestionConfig {
  text: string;
  options: ChatOption[];
  allowOther: boolean;
}

export const questions: Record<string, QuestionConfig> = {
  mode: {
    text: "What type of presentation would you like?",
    options: [
      { label: "Generate from notes", value: "generate" },
      { label: "Summarize a text", value: "summarize" },
      { label: "Compare two things", value: "compare" },
      { label: "Pros & Cons analysis", value: "proscons" },
      { label: "Research a topic", value: "research" },
    ],
    allowOther: false,
  },
  slideCount: {
    text: "How many slides would you like?",
    options: [
      { label: "3 slides", value: "3" },
      { label: "5 slides", value: "5" },
      { label: "7 slides", value: "7" },
      { label: "10 slides", value: "10" },
    ],
    allowOther: true,
  },
  tone: {
    text: "What tone should the presentation have?",
    options: [
      { label: "Professional", value: "professional" },
      { label: "Casual", value: "casual" },
      { label: "Academic", value: "academic" },
    ],
    allowOther: true,
  },
  anything_else: {
    text: "Is there anything else I should know? Any specific focus, audience, or details?",
    options: [{ label: "No, that's everything!", value: "no" }],
    allowOther: true,
  },
};
