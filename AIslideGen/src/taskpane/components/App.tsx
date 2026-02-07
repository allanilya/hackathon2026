import * as React from "react";
import { useReducer, useState, useEffect, useCallback } from "react";
import Header from "./Header";
import ChatContainer from "./ChatContainer";
import ChatInput from "./ChatInput";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowReset24Regular } from "@fluentui/react-icons";
import { createSlide } from "../taskpane";
import { useSlideDetection } from "../hooks/useSlideDetection";
import { getSlideContent, getAllSlidesContent } from "../services/slideService";
import { questions } from "../questions";
import { parseUserIntent } from "../utils/intentParser";
import type { ConversationState, ConversationStep, ChatMessage, ChatOption, GeneratedSlide, Mode, Tone } from "../types";

/* global fetch */

interface AppProps {
  title: string;
}

const useStyles = makeStyles({
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  resetRow: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
  },
});

// ── Helpers ──

let idCounter = 0;
function generateId(): string {
  return `msg_${Date.now()}_${++idCounter}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeAssistantMessage(text: string, options?: ChatOption[], allowOther?: boolean): ChatMessage {
  return { id: generateId(), role: "assistant", text, options, allowOther, timestamp: Date.now() };
}

function makeUserMessage(text: string): ChatMessage {
  return { id: generateId(), role: "user", text, timestamp: Date.now() };
}

const stepOrder: ConversationStep[] = ["initial", "mode", "slideCount", "tone", "anything_else", "generating", "complete"];

function nextStep(current: ConversationStep): ConversationStep {
  const idx = stepOrder.indexOf(current);
  if (idx === -1 || idx >= stepOrder.length - 1) return current;
  return stepOrder[idx + 1];
}

// ── Reducer ──

type Action =
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "SET_STEP"; step: ConversationStep }
  | { type: "SET_USER_PROMPT"; prompt: string }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_SLIDE_COUNT"; count: number }
  | { type: "SET_TONE"; tone: Tone }
  | { type: "SET_ADDITIONAL_CONTEXT"; text: string }
  | { type: "RESET" };

const initialState: ConversationState = {
  step: "initial",
  userPrompt: "",
  mode: "generate",
  slideCount: 3,
  tone: "professional",
  additionalContext: "",
  messages: [],
};

function chatReducer(state: ConversationState, action: Action): ConversationState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_USER_PROMPT":
      return { ...state, userPrompt: action.prompt };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_SLIDE_COUNT":
      return { ...state, slideCount: action.count };
    case "SET_TONE":
      return { ...state, tone: action.tone };
    case "SET_ADDITIONAL_CONTEXT":
      return { ...state, additionalContext: action.text };
    case "RESET":
      return { ...initialState, messages: [] };
    default:
      return state;
  }
}

// ── Placeholders ──

function getPlaceholder(step: ConversationStep): string {
  switch (step) {
    case "initial":
      return "Tell me what your presentation is about...";
    case "anything_else":
      return "Type any additional details, or pick an option above...";
    case "generating":
      return "Generating your slides...";
    case "summarize_ask":
      return "Pick an option above...";
    case "summarize_generating":
      return "Summarizing...";
    case "complete":
      return "Start a new conversation...";
    default:
      return "Type your answer or pick an option above...";
  }
}

// ── App ──

const App: React.FC<AppProps> = (props: AppProps) => {
  const styles = useStyles();
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [isTyping, setIsTyping] = useState(false);
  const [slides, setSlides] = useState<GeneratedSlide[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  // Always-on slide detection
  const { currentSlide, totalSlides } = useSlideDetection({
    enabled: true,
  });

  // Show initial greeting on mount
  useEffect(() => {
    const greeting = makeAssistantMessage(
      "Hi! I'm Spark. Tell me what you'd like to create a presentation about."
    );
    dispatch({ type: "ADD_MESSAGE", message: greeting });
  }, []);

  const advanceConversation = useCallback(
    async (currentStep: ConversationStep) => {
      const next = nextStep(currentStep);
      dispatch({ type: "SET_STEP", step: next });

      if (next === "generating") {
        return; // generation is handled separately
      }

      // Build the next question message
      const questionConfig = questions[next];
      if (questionConfig) {
        setIsTyping(true);
        await delay(400);
        setIsTyping(false);

        let text = questionConfig.text;
        // Add a friendly prefix for the mode question
        if (next === "mode") {
          text = `Great topic! ${text}`;
        }

        const msg = makeAssistantMessage(text, questionConfig.options, questionConfig.allowOther);
        dispatch({ type: "ADD_MESSAGE", message: msg });
      }
    },
    []
  );

  const generateSlides = useCallback(async () => {
    setIsTyping(true);

    const genMsg = makeAssistantMessage("Perfect! Generating your slides now...");
    dispatch({ type: "ADD_MESSAGE", message: genMsg });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: state.userPrompt,
          mode: state.mode,
          slideCount: state.slideCount,
          tone: state.tone,
          additionalContext: state.additionalContext,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      setSlides(data.slides || []);
      dispatch({ type: "SET_STEP", step: "complete" });

      const doneMsg = makeAssistantMessage(
        `Here are your ${data.slides?.length || 0} slides! You can insert them individually or all at once into your presentation.`
      );
      dispatch({ type: "ADD_MESSAGE", message: doneMsg });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate slides";
      const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      dispatch({ type: "SET_STEP", step: "anything_else" });
    } finally {
      setIsTyping(false);
    }
  }, [state.userPrompt, state.mode, state.slideCount, state.tone, state.additionalContext]);

  const handleSummarize = useCallback(async () => {
    dispatch({ type: "SET_STEP", step: "summarize_ask" });

    setIsTyping(true);
    await delay(400);
    setIsTyping(false);

    const askMsg = makeAssistantMessage(
      "What would you like me to summarize?",
      [
        { label: "Current Slide", value: "current_slide" },
        { label: "Entire Slideshow", value: "entire_slideshow" },
      ]
    );
    dispatch({ type: "ADD_MESSAGE", message: askMsg });
  }, []);

  const runSummarize = useCallback(async (scope: "current_slide" | "entire_slideshow") => {
    dispatch({ type: "SET_STEP", step: "summarize_generating" });
    setIsTyping(true);

    const genMsg = makeAssistantMessage(
      scope === "current_slide"
        ? "Summarizing the current slide..."
        : "Summarizing the entire slideshow..."
    );
    dispatch({ type: "ADD_MESSAGE", message: genMsg });

    try {
      let contentText: string;

      if (scope === "current_slide") {
        const content = await getSlideContent();
        const parts: string[] = [];
        if (content.title) parts.push(`Title: ${content.title}`);
        if (content.textContent.length > 0) parts.push(content.textContent.join("\n"));
        contentText = parts.join("\n") || "No text content found on this slide.";
      } else {
        const allContent = await getAllSlidesContent();
        contentText = allContent
          .map((slide, i) => {
            const parts: string[] = [`Slide ${i + 1}:`];
            if (slide.title) parts.push(`Title: ${slide.title}`);
            if (slide.textContent.length > 0) parts.push(slide.textContent.join("\n"));
            return parts.join("\n");
          })
          .join("\n\n") || "No text content found in the presentation.";
      }

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: contentText,
          scope,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      dispatch({ type: "SET_STEP", step: "initial" });

      const summaryMsg = makeAssistantMessage(data.summary || "No summary available.");
      dispatch({ type: "ADD_MESSAGE", message: summaryMsg });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate summary";
      const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      dispatch({ type: "SET_STEP", step: "initial" });
    } finally {
      setIsTyping(false);
    }
  }, []);

  const handleSend = useCallback(
    async (text: string, option?: ChatOption) => {
      // Add user message
      const userMsg = makeUserMessage(text);
      dispatch({ type: "ADD_MESSAGE", message: userMsg });

      const currentStep = state.step;

      switch (currentStep) {
        case "initial": {
          // Parse user intent from the message
          const intent = parseUserIntent(text);

          // Set the topic/prompt
          dispatch({ type: "SET_USER_PROMPT", prompt: intent.topic || text });

          // Auto-set detected values
          if (intent.slideCount !== undefined) {
            dispatch({ type: "SET_SLIDE_COUNT", count: intent.slideCount });
          }
          if (intent.mode) {
            dispatch({ type: "SET_MODE", mode: intent.mode });
          }
          if (intent.tone) {
            dispatch({ type: "SET_TONE", tone: intent.tone });
          }

          // If we have all needed info, skip to generation
          if (intent.hasAllInfo && intent.slideCount !== undefined && intent.mode && intent.tone) {
            dispatch({ type: "SET_STEP", step: "generating" });
            await delay(300);
            await generateSlides();
          } else {
            // Otherwise, ask for missing information
            // Determine which step to go to next
            let nextStep: ConversationStep = "mode";

            // Skip mode if already detected
            if (intent.mode) {
              nextStep = "slideCount";
            }

            // Skip slideCount if already detected
            if (intent.mode && intent.slideCount !== undefined) {
              nextStep = "tone";
            }

            // Skip tone if already detected
            if (intent.mode && intent.slideCount !== undefined && intent.tone) {
              nextStep = "anything_else";
            }

            dispatch({ type: "SET_STEP", step: nextStep });

            // Show the next question
            const questionConfig = questions[nextStep];
            if (questionConfig) {
              setIsTyping(true);
              await delay(400);
              setIsTyping(false);

              let questionText = questionConfig.text;
              if (nextStep === "mode") {
                questionText = `Great! ${questionText}`;
              }

              const msg = makeAssistantMessage(questionText, questionConfig.options, questionConfig.allowOther);
              dispatch({ type: "ADD_MESSAGE", message: msg });
            }
          }
          break;
        }

        case "mode": {
          const modeValue = (option?.value || "generate") as Mode;
          dispatch({ type: "SET_MODE", mode: modeValue });
          await advanceConversation(currentStep);
          break;
        }

        case "slideCount": {
          const parsed = parseInt(option?.value || text, 10);
          const count = isNaN(parsed) ? 3 : Math.max(1, Math.min(10, parsed));
          dispatch({ type: "SET_SLIDE_COUNT", count });
          await advanceConversation(currentStep);
          break;
        }

        case "tone": {
          const toneValue = (option?.value || text.toLowerCase()) as Tone;
          const validTones: Tone[] = ["professional", "casual", "academic"];
          dispatch({ type: "SET_TONE", tone: validTones.includes(toneValue) ? toneValue : "professional" });
          await advanceConversation(currentStep);
          break;
        }

        case "anything_else": {
          if (option?.value === "no") {
            dispatch({ type: "SET_ADDITIONAL_CONTEXT", text: "" });
          } else {
            dispatch({ type: "SET_ADDITIONAL_CONTEXT", text });
          }
          dispatch({ type: "SET_STEP", step: "generating" });
          // Small delay, then generate
          await delay(300);
          await generateSlides();
          break;
        }

        case "summarize_ask": {
          const scope = (option?.value || "current_slide") as "current_slide" | "entire_slideshow";
          await runSummarize(scope);
          break;
        }

        default:
          break;
      }
    },
    [state.step, advanceConversation, generateSlides, runSummarize]
  );

  const handleOptionSelect = useCallback(
    (messageId: string, option: ChatOption) => {
      setSelectedValues((prev) => ({ ...prev, [messageId]: option.value }));
      handleSend(option.label, option);
    },
    [handleSend]
  );

  const handleOtherSubmit = useCallback(
    (_messageId: string, text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  const handleFileUpload = useCallback(
    async (fileName: string, extractedText: string) => {
      if (state.step === "initial") {
        const userMsg = makeUserMessage(`Uploaded: ${fileName}`);
        dispatch({ type: "ADD_MESSAGE", message: userMsg });
        dispatch({ type: "SET_USER_PROMPT", prompt: extractedText });
        await advanceConversation("initial");
      } else if (state.step === "anything_else") {
        const userMsg = makeUserMessage(`Uploaded: ${fileName}`);
        dispatch({ type: "ADD_MESSAGE", message: userMsg });
        dispatch({ type: "SET_ADDITIONAL_CONTEXT", text: extractedText });
        dispatch({ type: "SET_STEP", step: "generating" });
        await delay(300);
        await generateSlides();
      }
    },
    [state.step, advanceConversation, generateSlides]
  );

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    setSlides([]);
    setSelectedValues({});
    setIsTyping(false);
    // Re-add greeting after reset
    setTimeout(() => {
      const greeting = makeAssistantMessage(
        "Hi! I'm Spark. Tell me what you'd like to create a presentation about."
      );
      dispatch({ type: "ADD_MESSAGE", message: greeting });
    }, 100);
  }, []);

  const handleInsertSlide = async (slide: GeneratedSlide) => {
    await createSlide({ title: slide.title, bullets: slide.bullets });
  };

  const handleInsertAll = async () => {
    for (const slide of slides) {
      await createSlide({ title: slide.title, bullets: slide.bullets });
    }
  };

  const inputDisabled = state.step === "generating" || isTyping;

  return (
    <div className={styles.root}>
      <Header logo="assets/logo-filled.png" title={props.title} />
      <ChatContainer
        messages={state.messages}
        onOptionSelect={handleOptionSelect}
        onOtherSubmit={handleOtherSubmit}
        isTyping={isTyping}
        slides={slides}
        onInsertSlide={handleInsertSlide}
        onInsertAll={handleInsertAll}
        selectedValues={selectedValues}
      />
      {state.step === "complete" && (
        <div className={styles.resetRow}>
          <Button
            appearance="subtle"
            icon={<ArrowReset24Regular />}
            onClick={handleReset}
            size="small"
          >
            Start Over
          </Button>
        </div>
      )}
      <ChatInput
        onSend={(text) => handleSend(text)}
        onFileUpload={handleFileUpload}
        disabled={inputDisabled}
        placeholder={getPlaceholder(state.step)}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        onSummarize={handleSummarize}
      />
    </div>
  );
};

export default App;
