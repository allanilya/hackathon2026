import * as React from "react";
import { useReducer, useState, useEffect, useCallback, useRef } from "react";
import Header from "./Header";
import ChatContainer from "./ChatContainer";
import ChatInput from "./ChatInput";
import ConversationSelector from "./ConversationSelector";
import AuthScreen from "./AuthScreen";
import { Button, makeStyles, tokens, Spinner } from "@fluentui/react-components";
import { SignOut20Regular } from "@fluentui/react-icons";
import { createSlide, applyEdits, SlideTheme } from "../taskpane";
import { useSlideDetection } from "../hooks/useSlideDetection";
import { getSlideContent, getAllSlidesContent, getSlideShapeDetails, goToSlide } from "../services/slideService";
import { getDocumentId } from "../services/documentService";
import { questions } from "../questions";
import { parseUserIntent, detectsCurrentEvents, hasProvidedUrl, extractUrl, isGreeting, isQuestion, isSlideRequest, isEditRequest, parseEditTarget, isSummaryRequest, isSlideQuestion } from "../utils/intentParser";
import { getOrCreateDocumentId } from "../utils/documentId";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchConversations,
  fetchMessages,
  createConversation,
  updateConversation,
  saveMessage,
} from "../services/conversationService";
import type { ConversationState, ConversationStep, ChatMessage, ChatOption, GeneratedSlide, Mode, Tone, SearchResult, Conversation, ImageData } from "../types";

/* global fetch */

interface AppProps {
  title: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

const useStyles = makeStyles({
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  resetRow: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "12px",
    paddingBottom: "12px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  loadingRoot: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colorNeutralBackground1,
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

function makeAssistantMessage(
  text: string,
  options?: ChatOption[],
  allowOther?: boolean,
  searchResults?: SearchResult[],
  slides?: GeneratedSlide[]
): ChatMessage {
  return { id: generateId(), role: "assistant", text, options, allowOther, searchResults, slides, timestamp: Date.now() };
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
  | { type: "SET_IMAGE"; image: ImageData | undefined }
  | { type: "SET_IMAGE_EMBED_MODE"; embedMode: boolean }
  | { type: "SET_EXTRACTED_IMAGES"; images: ImageData[] }
  | { type: "CLEAR_SEARCH_RESULTS" }
  | { type: "RESET" };

const initialState: ConversationState = {
  step: "initial",
  userPrompt: "",
  mode: "generate",
  slideCount: 3,
  tone: "professional",
  additionalContext: "",
  messages: [],
  image: undefined,
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
    case "SET_IMAGE":
      return { ...state, image: action.image };
    case "SET_IMAGE_EMBED_MODE":
      return { ...state, embedMode: action.embedMode };
    case "SET_EXTRACTED_IMAGES":
      return { ...state, extractedImages: action.images };
    case "RESET":
      return { ...initialState, messages: [] };
    case "CLEAR_SEARCH_RESULTS":
      return {
        ...state,
        messages: state.messages.map((msg) => {
          if (msg.searchResults) {
            const { searchResults, ...rest } = msg;
            return rest;
          }
          return msg;
        }),
      };
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
    case "web_search_query":
      return "What would you like to search for?";
    case "web_search_results":
      return "Searching...";
    case "web_search_permission":
      return "Pick an option above or type your response...";
    case "image_context":
      return "Tell me about this image or what you'd like to focus on (optional)...";
    case "image_upload_choice":
      return "Pick an option above...";
    case "file_image_choice":
      return "Pick an option above...";
    case "image_analysis":
      return "Analyzing image...";
    case "image_followup":
      return "Answer the questions above or add more details...";
    case "editing":
      return "Applying edits...";
    case "edit_complete":
      return "What else would you like to change?";
    case "complete":
      return "Start a new conversation...";
    default:
      return "Type your answer or pick an option above...";
  }
}

// ── App ──

let convIdCounter = 0;
function generateConvId(): string {
  return `conv_${Date.now()}_${++convIdCounter}`;
}

function deriveConversationTitle(state: ConversationState): string {
  const firstUserMsg = state.messages.find((m) => m.role === "user");
  if (firstUserMsg) {
    const trimmed = firstUserMsg.text.slice(0, 30);
    return trimmed.length < firstUserMsg.text.length ? `${trimmed}...` : trimmed;
  }
  return "New Chat";
}

const App: React.FC<AppProps> = (props: AppProps) => {
  const styles = useStyles();
  const { user, loading: authLoading, signOut } = useAuth();
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [isTyping, setIsTyping] = useState(false);
  const [slides, setSlides] = useState<GeneratedSlide[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [isWebSearchMode, setIsWebSearchMode] = useState(false);
  const [allowAllSearches, setAllowAllSearches] = useState(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState<string>("");
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Multi-conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");

  // Ref to track whether we should persist (skip during initial load)
  const isRestoringRef = useRef(false);
  // Debounce timer for saving conversation state
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load conversations from Supabase on login ──
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConversationId("");
      setLoadingConversations(false);
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setLoadingConversations(true);
      try {
        // Get the document ID first
        const docId = await getOrCreateDocumentId();
        setDocumentId(docId);

        const convs = await fetchConversations(user.id, docId);

        if (cancelled) return;

        if (convs.length === 0) {
          // Create a fresh conversation
          const id = generateConvId();
          const newConv: Conversation = {
            id,
            title: "New Chat",
            state: initialState,
            slides: [],
            selectedValues: {},
            createdAt: Date.now(),
            documentId: docId,
          };
          await createConversation(user.id, newConv);
          setConversations([newConv]);
          setActiveConversationId(id);
          dispatch({ type: "RESET" });
          setSlides([]);
          setSelectedValues({});

          // Show greeting
          const greeting = makeAssistantMessage(
            "Hi! I'm Slider. Tell me what you'd like to create a presentation about."
          );
          dispatch({ type: "ADD_MESSAGE", message: greeting });
          await saveMessage(id, greeting).catch(() => {});
        } else {
          // Load the most recent conversation fully
          const latest = convs[0];
          const messages = await fetchMessages(latest.id);
          latest.state.messages = messages;

          // Seed RAG store with conversation history (fire-and-forget)
          if (messages.length > 0) {
            fetch("/api/rag/seed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId: latest.id,
                messages: messages.slice(-50).map((m) => ({ role: m.role, content: m.text })),
              }),
            }).catch(() => {});
          }

          setConversations(convs);
          setActiveConversationId(latest.id);

          // Restore state
          isRestoringRef.current = true;
          dispatch({ type: "RESET" });
          setSlides(latest.slides);
          setSelectedValues(latest.selectedValues);

          setTimeout(() => {
            dispatch({ type: "SET_STEP", step: latest.state.step });
            dispatch({ type: "SET_USER_PROMPT", prompt: latest.state.userPrompt });
            dispatch({ type: "SET_MODE", mode: latest.state.mode });
          dispatch({ type: "SET_SLIDE_COUNT", count: latest.state.slideCount });
          dispatch({ type: "SET_TONE", tone: latest.state.tone });
          dispatch({ type: "SET_ADDITIONAL_CONTEXT", text: latest.state.additionalContext });
          dispatch({ type: "SET_IMAGE", image: latest.state.image });
            messages.forEach((msg) => {
              dispatch({ type: "ADD_MESSAGE", message: msg });
            });

            // If the latest conversation has no messages, show greeting
            if (messages.length === 0) {
              const greeting = makeAssistantMessage(
                "Hi! I'm Slider. Tell me what you'd like to create a presentation about."
              );
              dispatch({ type: "ADD_MESSAGE", message: greeting });
              saveMessage(latest.id, greeting).catch(() => {});
            }

            // Allow persistence again after restore completes
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 100);
          }, 0);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
        // Fallback: create a local conversation
        const id = generateConvId();
        const newConv: Conversation = {
          id,
          title: "New Chat",
          state: initialState,
          slides: [],
          selectedValues: {},
          createdAt: Date.now(),
        };
        setConversations([newConv]);
        setActiveConversationId(id);
        dispatch({ type: "RESET" });

        const greeting = makeAssistantMessage(
          "Hi! I'm Slider. Tell me what you'd like to create a presentation about."
        );
        dispatch({ type: "ADD_MESSAGE", message: greeting });
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  // Sync current state back to conversations list and debounce-save to Supabase
  useEffect(() => {
    if (!activeConversationId) return;

    const title = deriveConversationTitle(state);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, state, slides, selectedValues, title }
          : c
      )
    );

    // Debounced save to Supabase (skip during restore)
    if (!isRestoringRef.current && user) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const stateWithoutMessages = { ...state, messages: [] };
        updateConversation(activeConversationId, {
          title,
          state: stateWithoutMessages,
          slides,
          selectedValues,
        }).catch((err) => console.error("Failed to save conversation:", err));
      }, 1000);
    }
  }, [state, slides, selectedValues, activeConversationId, user]);

  const handleSelectConversation = useCallback(async (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target || target.id === activeConversationId) return;

    // Load messages for the target conversation if needed
    let messages = target.state.messages;
    if (messages.length === 0) {
      try {
        messages = await fetchMessages(id);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    }

    // Seed RAG store with conversation history (fire-and-forget)
    if (messages.length > 0) {
      fetch("/api/rag/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: id,
          messages: messages.slice(-50).map((m) => ({ role: m.role, content: m.text })),
        }),
      }).catch(() => {});
    }

    setActiveConversationId(id);
    isRestoringRef.current = true;
    dispatch({ type: "RESET" });
    setSlides(target.slides);
    setSelectedValues(target.selectedValues);

    setTimeout(() => {
      dispatch({ type: "SET_STEP", step: target.state.step });
      dispatch({ type: "SET_USER_PROMPT", prompt: target.state.userPrompt });
          dispatch({ type: "SET_MODE", mode: target.state.mode });
          dispatch({ type: "SET_SLIDE_COUNT", count: target.state.slideCount });
          dispatch({ type: "SET_TONE", tone: target.state.tone });
          dispatch({ type: "SET_ADDITIONAL_CONTEXT", text: target.state.additionalContext });
          dispatch({ type: "SET_IMAGE", image: target.state.image });
      messages.forEach((msg) => {
        dispatch({ type: "ADD_MESSAGE", message: msg });
      });
      setTimeout(() => { isRestoringRef.current = false; }, 100);
    }, 0);
  }, [conversations, activeConversationId]);

  const handleNewConversation = useCallback(async () => {
    const id = generateConvId();
    const docId = await getOrCreateDocumentId();
    const newConv: Conversation = {
      id,
      title: "New Chat",
      state: initialState,
      slides: [],
      selectedValues: {},
      createdAt: Date.now(),
      documentId: docId,
    };

    // Save to Supabase with document ID
    if (user) {
      createConversation(user.id, newConv).catch((err) =>
        console.error("Failed to create conversation:", err)
      );
    }

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(id);
    dispatch({ type: "RESET" });
    setSlides([]);
    setSelectedValues({});
    setIsTyping(false);
    setIsWebSearchMode(false);
    setTimeout(() => {
      const greeting = makeAssistantMessage(
        "Hi! I'm Slider. Tell me what you'd like to create a presentation about."
      );
      dispatch({ type: "ADD_MESSAGE", message: greeting });
      saveMessage(id, greeting).catch(() => {});
    }, 100);
  }, [user]);

  // Always-on slide detection
  const { currentSlide, totalSlides } = useSlideDetection({
    enabled: true,
  });

  // Helper to save a message to Supabase (fire-and-forget)
  const persistMessage = useCallback(
    async (message: ChatMessage): Promise<void> => {
      if (!user || !activeConversationId) return;
      try {
        await saveMessage(activeConversationId, message);
      } catch (err) {
        console.error("Failed to save:", err);
        await saveMessage(activeConversationId, message).catch((retryErr) => {
          console.error("Retry failed:", retryErr);
        });
      }
    },
    [user, activeConversationId]
  );

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
        await persistMessage(msg);
      }
    },
    [persistMessage]
  );

  const buildConversationHistory = useCallback(
    (messages: ChatMessage[]): Array<{ role: "user" | "assistant"; content: string }> => {
      return messages.slice(-4).map((msg) => ({
        role: msg.role,
        content: msg.text,
      }));
    },
    []
  );

  const generateSlides = useCallback(async () => {
    setIsTyping(true);

    let searchContext = "";

    // If mode is "research", perform web search first
    if (state.mode === "research") {
      const searchMsg = makeAssistantMessage("Researching the topic...");
      dispatch({ type: "ADD_MESSAGE", message: searchMsg });

      try {
        const searchResponse = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: state.userPrompt,
            maxResults: 5,
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const results = searchData.results || [];

          if (results.length > 0) {
            // Format search results as context
            searchContext = results
              .map((r: any, i: number) => `Source ${i + 1} (${r.source}):\n${r.title}\n${r.snippet}`)
              .join("\n\n");

            const foundMsg = makeAssistantMessage(
              `Found ${results.length} sources. Generating slides with research...`
            );
            dispatch({ type: "ADD_MESSAGE", message: foundMsg });
          }
        }
      } catch (searchErr) {
        console.error("Search failed, continuing without search context:", searchErr);
      }
    }

    // Create contextual message that references what we're generating
    const topic = state.userPrompt.length > 50
      ? state.userPrompt.substring(0, 50) + "..."
      : state.userPrompt;

    const genMsg = makeAssistantMessage(
      state.mode === "research"
        ? `Creating slides from research about ${topic}...`
        : searchContext
        ? `Creating slides from research...`
        : state.image
        ? `Analyzing your image and creating ${state.slideCount} slides...`
        : `Perfect! Generating ${state.slideCount} slides about ${topic}...`
    );
    dispatch({ type: "ADD_MESSAGE", message: genMsg });
    await persistMessage(genMsg);

    // Get recent conversation history with proper roles
    const conversationHistory = buildConversationHistory(state.messages);

    try {
      let response;
      let modifiedData: any = null; // Track if we already parsed and modified the response
      const hasTextContext = !!(state.userPrompt || state.additionalContext);

      // Decision logic for image handling:
      // 1. If user provides text context + image → Use text generation (don't analyze image)
      // 2. If user has image but NO text context → Analyze image content
      // 3. If no image → Normal text generation

      if (state.image && state.embedMode && hasTextContext) {
        // User wants to embed image with specific text context
        // Use text-based generation, then add image reference to slides
        const imageWithId = state.image as any;
        const textInput = state.userPrompt || state.additionalContext || "Create slides with this image";

        response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: textInput,
            mode: state.mode || "generate",
            slideCount: state.slideCount,
            tone: state.tone,
            additionalContext: state.userPrompt ? state.additionalContext : undefined,
            conversationHistory,
            conversationId: activeConversationId,
          }),
        });

        // After getting slides, add image reference to them
        if (response.ok) {
          modifiedData = await response.json();
          console.log("[generateSlides] Original slides from API:", modifiedData.slides);

          if (modifiedData.slides && imageWithId.uploadedImageId) {
            console.log("[generateSlides] Adding image reference with ID:", imageWithId.uploadedImageId);
            // Add image reference to all slides
            modifiedData.slides = modifiedData.slides.map((slide: any, index: number) => ({
              ...slide,
              images: [{
                image_id: imageWithId.uploadedImageId,
                role: "primary",
                alt_text: slide.title || "Presentation image"
              }],
              imageLayout: {
                position: index % 2 === 0 ? "left" : "right",
                width: 35,
                height: 50
              }
            }));
            console.log("[generateSlides] Modified slides with image:", modifiedData.slides);
          } else if (modifiedData.slides) {
            console.log("[generateSlides] Adding legacy image data (no uploadedImageId)");
            // Fallback: Add legacy image data if no uploadedImageId
            modifiedData.slides = modifiedData.slides.map((slide: any, index: number) => ({
              ...slide,
              image: state.image,
              imageLayout: {
                position: index % 2 === 0 ? "left" : "right",
                width: 35,
                height: 50
              }
            }));
          }
        }
      } else if (state.image && state.embedMode !== undefined) {
        // User wants image analysis (no text context, or analyze-only mode)
        const imageWithId = state.image as any;

        response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: {
              base64: state.image.base64,
              mimeType: state.image.mimeType,
            },
            image_id: imageWithId.uploadedImageId,
            text: state.userPrompt || state.additionalContext,
            slideCount: state.slideCount,
            embedMode: state.embedMode,
            conversationId: activeConversationId,
          }),
        });
      } else {
        // Normal text generation (no image)
        response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: state.userPrompt,
            mode: state.mode,
            slideCount: state.slideCount,
            tone: state.tone,
            additionalContext: searchContext
              ? `${state.additionalContext}\n\nRESEARCH SOURCES:\n${searchContext}`
              : state.additionalContext,
            conversationHistory,
            conversationId: activeConversationId,
          }),
        });
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${response.status})`);
      }

      // Use modifiedData if we already parsed and modified the response, otherwise parse now
      const data = modifiedData || await response.json();
      const generatedSlides = data.slides || [];
      setSlides(generatedSlides);
      dispatch({ type: "SET_STEP", step: "complete" });

      const doneMsg = makeAssistantMessage(
        `Here are your ${generatedSlides.length} slides! You can insert them individually or all at once into your presentation.`,
        undefined,
        undefined,
        undefined,
        generatedSlides // Attach slides to this message
      );
      dispatch({ type: "ADD_MESSAGE", message: doneMsg });
      await persistMessage(doneMsg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate slides";
      const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      await persistMessage(errorMsg);
      dispatch({ type: "SET_STEP", step: "anything_else" });
    } finally {
      setIsTyping(false);
    }
  }, [state.userPrompt, state.mode, state.slideCount, state.tone, state.additionalContext, state.image, state.embedMode, state.messages, buildConversationHistory, persistMessage, activeConversationId]);

  const generateSlidesFromMultipleImages = useCallback(async () => {
    setIsTyping(true);

    const images = state.extractedImages || [];
    const imageCount = images.length;

    if (imageCount === 0) {
      console.error("[Multi-Image] No images to process");
      return;
    }

    const genMsg = makeAssistantMessage(
      `Analyzing ${imageCount} images and creating your slides...`
    );
    dispatch({ type: "ADD_MESSAGE", message: genMsg });
    await persistMessage(genMsg);

    try {
      const allSlides: GeneratedSlide[] = [];

      // Process each image sequentially to avoid rate limits
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`[Multi-Image] Processing image ${i + 1}/${imageCount}`);

        // Call API for this specific image (slideCount: 1 = one slide per image)
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: {
              base64: image.base64,
              mimeType: image.mimeType,
            },
            text: state.userPrompt || state.additionalContext || `Slide ${i + 1}`,
            slideCount: 1,
            embedMode: true,
            conversationId: activeConversationId,
          }),
        });

        if (!response.ok) {
          console.error(`[Multi-Image] Failed on image ${i + 1}`);
          continue; // Skip failed images, continue with others
        }

        const data = await response.json();
        if (data.slides && data.slides.length > 0) {
          allSlides.push(...data.slides);
        }
      }

      if (allSlides.length === 0) {
        throw new Error("Failed to generate any slides from images");
      }

      setSlides(allSlides);
      dispatch({ type: "SET_STEP", step: "complete" });

      const doneMsg = makeAssistantMessage(
        `Here are your ${allSlides.length} slides! Each one includes an image from your document.`,
        undefined,
        undefined,
        undefined,
        allSlides
      );
      dispatch({ type: "ADD_MESSAGE", message: doneMsg });
      await persistMessage(doneMsg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate slides";
      const errorMsg = makeAssistantMessage(
        `Sorry, something went wrong: ${message}. Please try again.`
      );
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      await persistMessage(errorMsg);
      dispatch({ type: "SET_STEP", step: "anything_else" });
    } finally {
      setIsTyping(false);
    }
  }, [state.extractedImages, state.userPrompt, state.additionalContext, persistMessage, activeConversationId]);

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
    await persistMessage(askMsg);
  }, [persistMessage]);

  const handleWebSearch = useCallback(async () => {
    setIsWebSearchMode(true);
    dispatch({ type: "SET_STEP", step: "web_search_query" });

    setIsTyping(true);
    await delay(400);
    setIsTyping(false);

    const askMsg = makeAssistantMessage("What would you like to search for?");
    dispatch({ type: "ADD_MESSAGE", message: askMsg });
  }, []);

  const handleDismissWebSearch = useCallback(() => {
    setIsWebSearchMode(false);
    dispatch({ type: "SET_STEP", step: "initial" });
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
    await persistMessage(genMsg);

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
      await persistMessage(summaryMsg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate summary";
      const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      await persistMessage(errorMsg);
      dispatch({ type: "SET_STEP", step: "initial" });
    } finally {
      setIsTyping(false);
    }
  }, [persistMessage]);

  const runSlideQuestion = useCallback(async (
    question: string,
    scope: "current_slide" | "full_presentation" | "specific_slide",
    slideNumber?: number
  ) => {
    setIsTyping(true);

    try {
      if (scope === "specific_slide" && slideNumber) {
        try {
          await goToSlide(slideNumber);
        } catch {
          // Continue anyway with whatever slide is current
        }
      }

      let contentText = "";
      if (scope === "full_presentation") {
        const allContent = await getAllSlidesContent();
        contentText = allContent
          .map((slide, i) => {
            const parts: string[] = [`Slide ${i + 1}:`];
            if (slide.title) parts.push(`Title: ${slide.title}`);
            if (slide.textContent.length > 0) parts.push(slide.textContent.join("\n"));
            return parts.join("\n");
          })
          .join("\n\n") || "";
      } else {
        const content = await getSlideContent();
        const parts: string[] = [];
        if (content.title) parts.push(`Title: ${content.title}`);
        if (content.textContent.length > 0) parts.push(content.textContent.join("\n"));
        contentText = parts.join("\n") || "";
      }

      const conversationHistory = buildConversationHistory(state.messages);

      const response = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          slideContent: contentText,
          conversationHistory,
          conversationId: activeConversationId,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      const answerMsg = makeAssistantMessage(data.answer || "I couldn't find an answer to that question.");
      dispatch({ type: "ADD_MESSAGE", message: answerMsg });
      await persistMessage(answerMsg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to answer question";
      const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      await persistMessage(errorMsg);
    } finally {
      setIsTyping(false);
    }
  }, [state.messages, buildConversationHistory, persistMessage, activeConversationId]);

  const runEditSlide = useCallback(async (editRequest: string) => {
    dispatch({ type: "SET_STEP", step: "editing" });
    setIsTyping(true);

    const analyzingMsg = makeAssistantMessage("Analyzing the current slide...");
    dispatch({ type: "ADD_MESSAGE", message: analyzingMsg });
    await persistMessage(analyzingMsg);

    try {
      // 1. Get detailed shape info from current slide
      const shapeDetails = await getSlideShapeDetails();

      if (shapeDetails.length === 0) {
        const noShapesMsg = makeAssistantMessage(
          "I couldn't find any content on the current slide to edit. Make sure you're on the slide you want to modify."
        );
        dispatch({ type: "ADD_MESSAGE", message: noShapesMsg });
        await persistMessage(noShapesMsg);
        dispatch({ type: "SET_STEP", step: "initial" });
        return;
      }

      // 2. Send to backend for AI processing
      const applyingMsg = makeAssistantMessage("Got it, applying your changes...");
      dispatch({ type: "ADD_MESSAGE", message: applyingMsg });
      await persistMessage(applyingMsg);

      const conversationHistory = buildConversationHistory(state.messages);

      const response = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideContent: { shapes: shapeDetails },
          editRequest,
          conversationHistory,
          conversationId: activeConversationId,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${response.status})`);
      }

      const editResponse = await response.json();
      const { instructions, summary } = editResponse;

      // 3. Apply the edit instructions via Office.js
      const results = await applyEdits(instructions);

      // 4. Report results
      dispatch({ type: "SET_STEP", step: "edit_complete" });

      const successMsg = makeAssistantMessage(
        `Done! ${summary}\n\nChanges applied:\n${results.map((r) => `- ${r}`).join("\n")}\n\nWould you like to make any other changes?`
      );
      dispatch({ type: "ADD_MESSAGE", message: successMsg });
      await persistMessage(successMsg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to edit slide";
      const errorMsg = makeAssistantMessage(
        `Sorry, something went wrong while editing: ${message}. Please try again.`
      );
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      await persistMessage(errorMsg);
      dispatch({ type: "SET_STEP", step: "initial" });
    } finally {
      setIsTyping(false);
    }
  }, [state.messages, buildConversationHistory, persistMessage, activeConversationId]);

  const runArticleFetch = useCallback(async (query: string, url: string) => {
    dispatch({ type: "SET_STEP", step: "generating" });
    setIsTyping(true);

    try {
      // Parse user intent to extract preferences
      const intent = parseUserIntent(query);
      const slideCount = intent.slideCount !== undefined ? intent.slideCount : (state.slideCount || 3);
      const tone = intent.tone || state.tone || "professional";
      const mode = intent.mode || "summarize"; // Default to summarize for article URLs
      const topic = intent.topic || `Article from ${url}`;

      const fetchMsg = makeAssistantMessage(`Fetching article from ${url}...`);
      dispatch({ type: "ADD_MESSAGE", message: fetchMsg });
      await persistMessage(fetchMsg);

      // Fetch article content
      const response = await fetch("/api/fetch-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      const articleContent = data.content || "";

      if (!articleContent) {
        throw new Error("No content found in article");
      }

      const contentMsg = makeAssistantMessage(
        `Got it! Creating ${slideCount} slides summarizing this article...`
      );
      dispatch({ type: "ADD_MESSAGE", message: contentMsg });
      await persistMessage(contentMsg);

      // Set up state for slide generation
      dispatch({ type: "SET_USER_PROMPT", prompt: topic });
      dispatch({ type: "SET_MODE", mode });
      dispatch({ type: "SET_SLIDE_COUNT", count: slideCount });
      dispatch({ type: "SET_TONE", tone });
      dispatch({
        type: "SET_ADDITIONAL_CONTEXT",
        text: `ARTICLE CONTENT:\n${articleContent.substring(0, 10000)}`, // Limit to 10k chars
      });

      await delay(300);

      // Generate slides
      const conversationHistory = buildConversationHistory(state.messages);

      const genResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: `Summarize this article about ${topic}`,
          mode,
          slideCount,
          tone,
          additionalContext: `ARTICLE FROM ${url}:\n${articleContent.substring(0, 10000)}`,
          conversationHistory,
          conversationId: activeConversationId,
        }),
      });

      if (!genResponse.ok) {
        const errBody = await genResponse.json().catch(() => ({}));
        throw new Error(errBody.error || `Generation failed (${genResponse.status})`);
      }

      const genData = await genResponse.json();
      const generatedSlides = genData.slides || [];
      setSlides(generatedSlides);
      dispatch({ type: "SET_STEP", step: "complete" });

      const doneMsg = makeAssistantMessage(
        `Here are your ${generatedSlides.length} slides summarizing the article! You can insert them individually or all at once into your presentation.`,
        undefined,
        undefined,
        undefined,
        generatedSlides // Attach slides to this message
      );
      dispatch({ type: "ADD_MESSAGE", message: doneMsg });
      await persistMessage(doneMsg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch article";
      const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      await persistMessage(errorMsg);
      dispatch({ type: "SET_STEP", step: "initial" });
    } finally {
      setIsTyping(false);
    }
  }, [state.slideCount, state.tone, state.messages, buildConversationHistory, persistMessage, activeConversationId]);

  const runWebSearch = useCallback(async (query: string) => {
    dispatch({ type: "SET_STEP", step: "web_search_results" });
    setIsTyping(true);

    // Parse user intent to extract preferences from the query
    const intent = parseUserIntent(query);
    // Use current state slideCount if available (for follow-ups), otherwise from intent or default to 3
    const slideCount = intent.slideCount !== undefined ? intent.slideCount : (state.slideCount || 3);
    const tone = intent.tone || state.tone || "professional";
    const mode = intent.mode || "research";
    const topic = intent.topic || query;

    // Scale search results based on slide count: more slides = more sources needed
    // Formula: slideCount + 3, minimum 5, maximum 12
    const maxResults = Math.min(Math.max(slideCount + 3, 5), 12);

    // Determine if web search is actually needed based on query context
    const needsWebSearch =
      mode === "research" ||
      /\b(latest|recent|current|today|2024|2025|2026|news|happening|developments|updates|situation|statistics|data|trends)\b/i.test(
        query
      );

    try {
      let searchContext = "";

      if (needsWebSearch) {
        const searchMsg = makeAssistantMessage(`Searching for "${topic}"...`);
        dispatch({ type: "ADD_MESSAGE", message: searchMsg });

        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: topic,
            maxResults,
            slideCount, // Pass slide count to backend for query optimization
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `Server error (${response.status})`);
        }

        const data = await response.json();
        const results: SearchResult[] = data.results || [];

        if (results.length === 0) {
          const noResultsMsg = makeAssistantMessage(
            "No results found. Generating slides from general knowledge instead..."
          );
          dispatch({ type: "ADD_MESSAGE", message: noResultsMsg });
        } else {
          // Format search results as context
          searchContext = results
            .map((r, i) => `Source ${i + 1} (${r.source}):\n${r.title}\n${r.snippet}`)
            .join("\n\n");

          const foundMsg = makeAssistantMessage(
            `Found ${results.length} sources. Creating ${slideCount} slides with research...`
          );
          dispatch({ type: "ADD_MESSAGE", message: foundMsg });
        }
      } else {
        const skipMsg = makeAssistantMessage(
          `This topic doesn't require web search. Generating ${slideCount} slides from general knowledge...`
        );
        dispatch({ type: "ADD_MESSAGE", message: skipMsg });
      }

      // Set up state for slide generation
      dispatch({ type: "SET_USER_PROMPT", prompt: topic });
      dispatch({ type: "SET_MODE", mode });
      dispatch({ type: "SET_SLIDE_COUNT", count: slideCount });
      dispatch({ type: "SET_TONE", tone });
      dispatch({
        type: "SET_ADDITIONAL_CONTEXT",
        text: searchContext ? `RESEARCH SOURCES:\n${searchContext}` : "",
      });
      dispatch({ type: "SET_STEP", step: "generating" });

      await delay(300);

      // Generate slides
      const genMsg = makeAssistantMessage(
        searchContext ? `Creating ${slideCount} slides from research...` : `Creating ${slideCount} slides...`
      );
      dispatch({ type: "ADD_MESSAGE", message: genMsg });

      // Get recent conversation history with proper roles
      const conversationHistory = buildConversationHistory(state.messages);

      const genResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: topic,
          mode,
          slideCount,
          tone,
          additionalContext: searchContext ? `RESEARCH SOURCES:\n${searchContext}` : "",
          conversationHistory,
          conversationId: activeConversationId,
        }),
      });

      if (!genResponse.ok) {
        const errBody = await genResponse.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${genResponse.status})`);
      }

      const genData = await genResponse.json();
      const generatedSlides = genData.slides || [];
      setSlides(generatedSlides);
      dispatch({ type: "SET_STEP", step: "complete" });

      const doneMsg = makeAssistantMessage(
        `Here are your ${generatedSlides.length} slides! You can insert them individually or all at once into your presentation.`,
        undefined,
        undefined,
        undefined,
        generatedSlides // Attach slides to this message
      );
      dispatch({ type: "ADD_MESSAGE", message: doneMsg });
      setIsWebSearchMode(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generation failed";
      const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      dispatch({ type: "SET_STEP", step: "initial" });
      setIsWebSearchMode(false);
    } finally {
      setIsTyping(false);
    }
  }, [state.messages, state.slideCount, state.tone, buildConversationHistory, activeConversationId]);

  const handleSend = useCallback(
    async (text: string, option?: ChatOption) => {
      // Add user message
      const userMsg = makeUserMessage(text);
      dispatch({ type: "ADD_MESSAGE", message: userMsg });
      await persistMessage(userMsg);

      const currentStep = state.step;

      switch (currentStep) {
        case "initial": {
          // CONTEXT MATTERS: Detect user intent carefully before assuming they want slides

          // 1. Check if it's a greeting
          if (isGreeting(text)) {
            const greetingMsg = makeAssistantMessage(
              "Hi there! 👋 I'm Slider, your AI presentation assistant. I can help you create slides about any topic. Just tell me what you'd like to make a presentation about!"
            );
            dispatch({ type: "ADD_MESSAGE", message: greetingMsg });
            await persistMessage(greetingMsg);
            return;
          }

          // 2. Check if it's an edit request (before slide generation check)
          if (isEditRequest(text)) {
            const editTarget = parseEditTarget(text);
            if (editTarget.scope === "specific" && editTarget.slideNumber) {
              try {
                await goToSlide(editTarget.slideNumber);
              } catch {
                const navMsg = makeAssistantMessage(
                  `Could not navigate to slide ${editTarget.slideNumber}. Please navigate there manually and try again.`
                );
                dispatch({ type: "ADD_MESSAGE", message: navMsg });
                await persistMessage(navMsg);
                return;
              }
            }
            await runEditSlide(text);

            return;
          }

          // 3. Check if it's a summary request
          const summaryIntent = isSummaryRequest(text);
          if (summaryIntent) {
            if (summaryIntent.scope === "specific_slide" && summaryIntent.slideNumber) {
              await runSlideQuestion(text, "specific_slide", summaryIntent.slideNumber);
            } else if (summaryIntent.scope === "full_presentation") {
              await runSummarize("entire_slideshow");
            } else {
              await runSummarize("current_slide");
            }
            return;
          }

          // 4. Check if it's a question about slides or general knowledge
          const questionIntent = isSlideQuestion(text);
          if (questionIntent) {
            await runSlideQuestion(questionIntent.question, questionIntent.scope, questionIntent.slideNumber);
            return;
          }

          // 5. Parse user intent from the message
          const intent = parseUserIntent(text);

          // 5. Check if user provided a specific URL - if so, fetch that article directly
          const providedUrl = extractUrl(text);
          if (providedUrl) {
            // User provided a URL - fetch it directly without asking permission
            await runArticleFetch(text, providedUrl);
            return;
          }

          // Check if web search is needed (toggle ON or current events detected)
          const needsWebSearch = isWebSearchMode || detectsCurrentEvents(text);
          if (needsWebSearch) {
            // Check if user has allowed all searches this session
            if (allowAllSearches) {
              // Auto-trigger web search with permission
              const msg = makeAssistantMessage("Searching the web for latest information...");
              dispatch({ type: "ADD_MESSAGE", message: msg });
              await persistMessage(msg);
              await runWebSearch(text);
              return;
            } else {
              // Ask for permission first, even if toggle is ON
              setPendingSearchQuery(text);
              dispatch({ type: "SET_STEP", step: "web_search_permission" });
              const permissionMsg = makeAssistantMessage(
                "This query would benefit from web search to get the latest information. Would you like me to search online?",
                [
                  { label: "Yes, search now", value: "yes" },
                  { label: "Yes, and allow all searches this session", value: "allow_all" },
                  { label: "No, continue without search", value: "no" },
                ]
              );
              dispatch({ type: "ADD_MESSAGE", message: permissionMsg });
              await persistMessage(permissionMsg);
              return;
            }
          }

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
              await persistMessage(msg);
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
          
          // If we have an image, generate slides with image instead of advancing conversation
          if (state.image) {
            dispatch({ type: "SET_STEP", step: "generating" });
            setIsTyping(true);
            
            try {
              const finalPrompt = state.userPrompt || "";
              const finalText = finalPrompt + (state.additionalContext ? `\n\n${state.additionalContext}` : "");
              
              const response = await fetch("/api/analyze-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  image: { base64: state.image.base64, mimeType: state.image.mimeType },
                  text: finalText || undefined,
                  slideCount: count,
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
                `Here are your ${data.slides?.length || 0} slides based on the image${finalText ? " and your input" : ""}! You can insert them individually or all at once into your presentation.`
              );
              dispatch({ type: "ADD_MESSAGE", message: doneMsg });
              await persistMessage(doneMsg);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Failed to generate slides";
              const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
              dispatch({ type: "ADD_MESSAGE", message: errorMsg });
              await persistMessage(errorMsg);
              dispatch({ type: "SET_STEP", step: state.userPrompt ? "image_followup" : "initial" });
            } finally {
              setIsTyping(false);
            }
          } else {
            // Normal flow: advance conversation
            await advanceConversation(currentStep);
          }
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
          await delay(300);

          // NEW: Check if we're processing multiple extracted images
          const hasMultipleImages = (state.extractedImages?.length || 0) > 1;

          if (hasMultipleImages && state.embedMode) {
            await generateSlidesFromMultipleImages();
          } else {
            await generateSlides();
          }
          break;
        }

        case "summarize_ask": {
          const scope = (option?.value || "current_slide") as "current_slide" | "entire_slideshow";
          await runSummarize(scope);
          break;
        }

        case "web_search_query": {
          await runWebSearch(text);
          break;
        }

        case "image_followup": {
          // User is answering follow-up questions or providing additional context
          // Update user prompt with the text provided
          if (!state.userPrompt) {
            dispatch({ type: "SET_USER_PROMPT", prompt: text });
          } else {
            dispatch({ type: "SET_ADDITIONAL_CONTEXT", text });
          }
          
          // If we have enough info, ask for slide count before generating
          if (text.trim().length > 10) {
            dispatch({ type: "SET_STEP", step: "slideCount" });
            setIsTyping(true);
            await delay(400);
            setIsTyping(false);

            const slideCountMsg = makeAssistantMessage(
              "Perfect! How many slides would you like me to create?",
              questions.slideCount.options,
              questions.slideCount.allowOther
            );
            dispatch({ type: "ADD_MESSAGE", message: slideCountMsg });
            await persistMessage(slideCountMsg);
          } else {
            // Ask for more details
            const askMsg = makeAssistantMessage(
              "Could you provide a bit more detail? What would you like the presentation to focus on?"
            );
            dispatch({ type: "ADD_MESSAGE", message: askMsg });
            await persistMessage(askMsg);
          }
          break;
        }

        case "complete": {
          // CONTEXT MATTERS: Detect user intent carefully before assuming they want slides

          // 1. Check if it's a greeting
          if (isGreeting(text)) {
            const greetingMsg = makeAssistantMessage(
              "Hey! 👋 How can I help you with your presentation? You can ask me to create slides, or just let me know what you'd like to work on."
            );
            dispatch({ type: "ADD_MESSAGE", message: greetingMsg });
            await persistMessage(greetingMsg);
            return;
          }

          // 2. Check if it's an edit request
          if (isEditRequest(text)) {
            const editTarget = parseEditTarget(text);
            if (editTarget.scope === "specific" && editTarget.slideNumber) {
              try {
                await goToSlide(editTarget.slideNumber);
              } catch {
                const navMsg = makeAssistantMessage(
                  `Could not navigate to slide ${editTarget.slideNumber}. Please navigate there manually and try again.`
                );
                dispatch({ type: "ADD_MESSAGE", message: navMsg });
                await persistMessage(navMsg);
                return;
              }
            }
            await runEditSlide(text);

            return;
          }

          // 3. Check if it's a summary request
          const summaryIntentC = isSummaryRequest(text);
          if (summaryIntentC) {
            if (summaryIntentC.scope === "specific_slide" && summaryIntentC.slideNumber) {
              await runSlideQuestion(text, "specific_slide", summaryIntentC.slideNumber);
            } else if (summaryIntentC.scope === "full_presentation") {
              await runSummarize("entire_slideshow");
            } else {
              await runSummarize("current_slide");
            }
            return;
          }

          // 4. Check if it's a question about slides or general knowledge
          const questionIntentC = isSlideQuestion(text);
          if (questionIntentC) {
            await runSlideQuestion(questionIntentC.question, questionIntentC.scope, questionIntentC.slideNumber);
            return;
          }

          // 5. Parse intent for slide generation
          const intent = parseUserIntent(text);
          const needsWebSearch = detectsCurrentEvents(text);

          // 6. Validate input - must have meaningful content for slide generation
          if (!intent.hasAllInfo && text.trim().length < 5) {
            const clarifyMsg = makeAssistantMessage(
              "I'd love to help! What would you like me to create slides about?"
            );
            dispatch({ type: "ADD_MESSAGE", message: clarifyMsg });
            await persistMessage(clarifyMsg);
            return;
          }

          // Check if user provided a specific URL - if so, fetch that article directly
          const providedUrl = extractUrl(text);
          if (providedUrl) {
            // User provided a URL - fetch it directly without asking permission
            setSlides([]);
            await runArticleFetch(text, providedUrl);
            return;
          }

          // Check if web search should be used (toggle ON OR current events detected)
          if (isWebSearchMode || needsWebSearch) {
            // Clear old slides
            setSlides([]);

            // Always ask for permission unless user allowed all
            if (!allowAllSearches) {
              // Ask for permission first, even if toggle is ON
              setPendingSearchQuery(text);
              dispatch({ type: "SET_STEP", step: "web_search_permission" });
              const permissionMsg = makeAssistantMessage(
                "This query would benefit from web search to get the latest information. Would you like me to search online?",
                [
                  { label: "Yes, search now", value: "yes" },
                  { label: "Yes, and allow all searches this session", value: "allow_all" },
                  { label: "No, continue without search", value: "no" },
                ]
              );
              dispatch({ type: "ADD_MESSAGE", message: permissionMsg });
              await persistMessage(permissionMsg);
              return;
            }

            // User has allowed all searches
            const msg = makeAssistantMessage("Searching the web for latest information...");
            dispatch({ type: "ADD_MESSAGE", message: msg });
            await persistMessage(msg);

            await runWebSearch(text);
            return;
          }

          // Normal flow (no web search needed)
          // Clear UI state and old search results to prevent reusing previous web search data
          setSlides([]);
          dispatch({ type: "CLEAR_SEARCH_RESULTS" });

          // Set new prompt and inherit previous settings for follow-up queries
          dispatch({ type: "SET_USER_PROMPT", prompt: intent.topic || text });
          dispatch({
            type: "SET_MODE",
            mode: intent.mode || state.mode, // Inherit previous mode if not specified
          });
          dispatch({
            type: "SET_SLIDE_COUNT",
            count: intent.slideCount !== undefined ? intent.slideCount : state.slideCount, // Inherit previous count
          });
          dispatch({
            type: "SET_TONE",
            tone: intent.tone || state.tone, // Inherit previous tone if not specified
          });

          // Generate immediately with inherited settings and conversation context
          dispatch({ type: "SET_STEP", step: "generating" });
          await delay(300);
          await generateSlides();
          break;
        }

        case "web_search_permission": {
          // Handle user's response to web search permission
          const choice = option?.value || text.toLowerCase();

          if (choice === "yes" || choice === "allow_all") {
            // Set allow all flag if requested
            if (choice === "allow_all") {
              setAllowAllSearches(true);
              const confirmMsg = makeAssistantMessage(
                "Got it! I'll automatically use web search for relevant queries for the rest of this session."
              );
              dispatch({ type: "ADD_MESSAGE", message: confirmMsg });
              await persistMessage(confirmMsg);
            }

            // Proceed with web search using the pending query
            const searchMsg = makeAssistantMessage("Searching the web for latest information...");
            dispatch({ type: "ADD_MESSAGE", message: searchMsg });
            await persistMessage(searchMsg);
            await runWebSearch(pendingSearchQuery);
            setPendingSearchQuery("");
          } else if (choice === "no") {
            // Continue without web search
            const continueMsg = makeAssistantMessage(
              "No problem! Continuing without web search. What would you like to create slides about?"
            );
            dispatch({ type: "ADD_MESSAGE", message: continueMsg });
            await persistMessage(continueMsg);
            dispatch({ type: "SET_STEP", step: "initial" });
            setPendingSearchQuery("");
          } else {
            // Invalid response
            const clarifyMsg = makeAssistantMessage(
              "Please choose one of the options above or type 'yes', 'no', or 'allow all'."
            );
            dispatch({ type: "ADD_MESSAGE", message: clarifyMsg });
            await persistMessage(clarifyMsg);
          }
          break;
        }

        case "image_upload_choice": {
          // Handle user's choice: embed image or analyze only
          const choice = option?.value || text.toLowerCase();

          if (choice.includes("embed")) {
            // Store preference: user wants image embedded
            dispatch({ type: "SET_IMAGE_EMBED_MODE", embedMode: true });

            // Ask for slide count
            dispatch({ type: "SET_STEP", step: "slideCount" });
            setIsTyping(true);
            await delay(400);
            setIsTyping(false);

            const slideCountMsg = makeAssistantMessage(
              "Great! How many slides would you like?",
              questions.slideCount.options,
              questions.slideCount.allowOther
            );
            dispatch({ type: "ADD_MESSAGE", message: slideCountMsg });
            await persistMessage(slideCountMsg);
          } else if (choice.includes("analyze")) {
            // Analyze only (text slides)
            dispatch({ type: "SET_IMAGE_EMBED_MODE", embedMode: false });

            // Ask for slide count
            dispatch({ type: "SET_STEP", step: "slideCount" });
            setIsTyping(true);
            await delay(400);
            setIsTyping(false);

            const slideCountMsg = makeAssistantMessage(
              "Perfect! How many text slides would you like me to create based on the image?",
              questions.slideCount.options,
              questions.slideCount.allowOther
            );
            dispatch({ type: "ADD_MESSAGE", message: slideCountMsg });
            await persistMessage(slideCountMsg);
          } else {
            // Invalid response
            const clarifyMsg = makeAssistantMessage(
              "Please choose one of the options above or include 'embed' or 'analyze' in your response."
            );
            dispatch({ type: "ADD_MESSAGE", message: clarifyMsg });
            await persistMessage(clarifyMsg);
          }
          break;
        }

        case "image_context": {
          // User is providing optional context about the image, or skipping
          const choice = option?.value || text.toLowerCase();
          let userProvidedContext = "";

          if (choice === "skip" || choice.includes("skip")) {
            // User wants to skip - don't store any additional context
            dispatch({ type: "SET_ADDITIONAL_CONTEXT", text: "" });
          } else if (text.trim().length > 0) {
            // User provided context - store it in additionalContext
            userProvidedContext = text.trim();
            dispatch({ type: "SET_ADDITIONAL_CONTEXT", text: userProvidedContext });
          }

          // Check if user's text indicates they want to embed the image
          const { wantsToEmbedImage, parseUserIntent } = await import("../utils/intentParser");
          const detectEmbed = userProvidedContext && wantsToEmbedImage(userProvidedContext);

          // Also check if user specified slide count
          const parsedIntent = userProvidedContext ? parseUserIntent(userProvidedContext) : null;
          const detectedSlideCount = parsedIntent?.slideCount;

          if (detectEmbed) {
            // User explicitly wants to embed - skip the choice question
            dispatch({ type: "SET_IMAGE_EMBED_MODE", embedMode: true });

            // Check if they also specified slide count
            if (detectedSlideCount) {
              // They specified both embed intent AND slide count - skip both questions
              dispatch({ type: "SET_SLIDE_COUNT", count: detectedSlideCount });
              dispatch({ type: "SET_STEP", step: "tone" });
              setIsTyping(true);
              await delay(400);
              setIsTyping(false);

              const toneMsg = makeAssistantMessage(
                `Perfect! I'll create ${detectedSlideCount} slide${detectedSlideCount > 1 ? 's' : ''}. What tone would you like?`,
                questions.tone.options,
                questions.tone.allowOther
              );
              dispatch({ type: "ADD_MESSAGE", message: toneMsg });
              await persistMessage(toneMsg);
            } else {
              // Only embed detected - ask for slide count
              dispatch({ type: "SET_STEP", step: "slideCount" });
              setIsTyping(true);
              await delay(400);
              setIsTyping(false);

              const slideCountMsg = makeAssistantMessage(
                "Great! How many slides would you like?",
                questions.slideCount.options,
                questions.slideCount.allowOther
              );
              dispatch({ type: "ADD_MESSAGE", message: slideCountMsg });
              await persistMessage(slideCountMsg);
            }
          } else {
            // Unclear intent - ask them to choose
            dispatch({ type: "SET_STEP", step: "image_upload_choice" });
            setIsTyping(true);
            await delay(400);
            setIsTyping(false);

            const choiceMsg = makeAssistantMessage(
              "How would you like me to use this image?",
              [
                { label: "Embed image in slides with text", value: "embed" },
                { label: "Just analyze and create text slides", value: "analyze" },
              ]
            );
            dispatch({ type: "ADD_MESSAGE", message: choiceMsg });
            await persistMessage(choiceMsg);
          }
          break;
        }

        case "file_image_choice": {
          // Handle user's choice: include images from DOCX or not
          const choice = option?.value || text.toLowerCase();

          if (choice.includes("include") || choice.includes("yes")) {
            // User wants to include images from DOCX
            dispatch({ type: "SET_IMAGE_EMBED_MODE", embedMode: true });

            // NEW: Auto-set slide count based on number of extracted images
            const imageCount = state.extractedImages?.length || 0;

            if (imageCount > 0) {
              console.log(`[Multi-Image] Found ${imageCount} images, auto-setting slide count`);
              dispatch({ type: "SET_SLIDE_COUNT", count: imageCount });

              // Show confirmation and skip directly to mode question
              setIsTyping(true);
              await delay(400);
              setIsTyping(false);

              const confirmMsg = makeAssistantMessage(
                `Perfect! I'll create ${imageCount} slides, one for each image. What type of presentation would you like?`,
                questions.mode.options,
                questions.mode.allowOther
              );
              dispatch({ type: "ADD_MESSAGE", message: confirmMsg });
              await persistMessage(confirmMsg);

              // Skip slideCount question - go directly to mode
              dispatch({ type: "SET_STEP", step: "mode" });
            } else {
              // No images, proceed with normal flow
              await advanceConversation("initial");
            }
          } else if (choice.includes("text") || choice.includes("no")) {
            // User wants text-only slides
            dispatch({ type: "SET_IMAGE_EMBED_MODE", embedMode: false });
            dispatch({ type: "SET_EXTRACTED_IMAGES", images: [] });

            // Proceed with conversation flow
            await advanceConversation("initial");
          } else {
            // Invalid response
            const clarifyMsg = makeAssistantMessage(
              "Please choose one of the options above or include 'yes/include' or 'no/text' in your response."
            );
            dispatch({ type: "ADD_MESSAGE", message: clarifyMsg });
            await persistMessage(clarifyMsg);
          }
          break;
        }

        case "edit_complete": {
          // User is continuing after a successful edit
          if (isEditRequest(text)) {
            const editTarget = parseEditTarget(text);
            if (editTarget.scope === "specific" && editTarget.slideNumber) {
              try {
                await goToSlide(editTarget.slideNumber);
              } catch {
                const navMsg = makeAssistantMessage(
                  `Could not navigate to slide ${editTarget.slideNumber}. Please navigate there manually and try again.`
                );
                dispatch({ type: "ADD_MESSAGE", message: navMsg });
                await persistMessage(navMsg);
                break;
              }
            }

            await runEditSlide(text);
          } else if (isGreeting(text)) {
            const greetingMsg = makeAssistantMessage(
              "Hey! Glad the edits worked out. What else can I help with?"
            );
            dispatch({ type: "ADD_MESSAGE", message: greetingMsg });
            await persistMessage(greetingMsg);
          } else {
            // Treat any unrecognized request in edit context as an edit
            await runEditSlide(text);
          }
          break;
        }

        default:
          break;
      }
    },
    [state.step, advanceConversation, generateSlides, generateSlidesFromMultipleImages, runSummarize, runSlideQuestion, runWebSearch, runEditSlide, runArticleFetch, persistMessage, allowAllSearches, pendingSearchQuery, isWebSearchMode]
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
    async (fileName: string, extractedText: string, extractedImages?: ImageData[]) => {
      if (state.step === "initial") {
        const userMsg = makeUserMessage(`Uploaded: ${fileName}`);
        dispatch({ type: "ADD_MESSAGE", message: userMsg });
        await persistMessage(userMsg);

        dispatch({ type: "SET_USER_PROMPT", prompt: extractedText });

        // If images found in DOCX, ask user if they want to include them
        if (extractedImages && extractedImages.length > 0) {
          dispatch({ type: "SET_EXTRACTED_IMAGES", images: extractedImages });

          const imageMsg = makeAssistantMessage(
            `I found ${extractedImages.length} image(s) in your document. Would you like to include them in the slides?`,
            [
              { label: "Yes, include images", value: "include" },
              { label: "No, text only", value: "text_only" },
            ]
          );
          dispatch({ type: "ADD_MESSAGE", message: imageMsg });
          await persistMessage(imageMsg);
          dispatch({ type: "SET_STEP", step: "file_image_choice" });
          return;
        }

        await advanceConversation("initial");
      } else if (state.step === "anything_else") {
        const userMsg = makeUserMessage(`Uploaded: ${fileName}`);
        dispatch({ type: "ADD_MESSAGE", message: userMsg });
        await persistMessage(userMsg);
        dispatch({ type: "SET_ADDITIONAL_CONTEXT", text: extractedText });
        dispatch({ type: "SET_STEP", step: "generating" });
        await delay(300);
        await generateSlides();
      }
    },
    [state.step, advanceConversation, generateSlides, persistMessage]
  );

  const handleImageUpload = useCallback(
    async (imageData: ImageData) => {
      // Upload image to Supabase storage and get image_id
      let uploadedImageId: string | undefined;

      if (activeConversationId) {
        try {
          const { uploadImage } = await import("../services/uploadService");
          const uploadResult = await uploadImage(activeConversationId, {
            name: imageData.fileName,
            base64: imageData.base64,
            mimeType: imageData.mimeType,
          });
          uploadedImageId = uploadResult.id;
          console.log(`[handleImageUpload] Uploaded image to Supabase with ID: ${uploadedImageId}`);
        } catch (error) {
          console.error("[handleImageUpload] Failed to upload to Supabase:", error);
          // Continue without Supabase storage - will use legacy base64 flow
        }
      }

      // Create user message with image (store both ID and data)
      const userMsg: ChatMessage = {
        ...makeUserMessage(`Uploaded image: ${imageData.fileName}`),
        image: { ...imageData, uploadedImageId } as any, // Store uploadedImageId for later use
      };
      dispatch({ type: "ADD_MESSAGE", message: userMsg });
      await persistMessage(userMsg);
      dispatch({ type: "SET_IMAGE", image: { ...imageData, uploadedImageId } as any });

      // NEW: First ask for optional context about the image
      dispatch({ type: "SET_STEP", step: "image_context" });
      setIsTyping(true);
      await delay(400);
      setIsTyping(false);

      const contextMsg = makeAssistantMessage(
        "Great! Tell me what this image is about or what you'd like me to focus on. (Or skip this step)",
        [
          { label: "Skip - just analyze the image", value: "skip" },
        ],
        true  // allowOther = true (user can type free text)
      );
      dispatch({ type: "ADD_MESSAGE", message: contextMsg });
      await persistMessage(contextMsg);
    },
    [persistMessage, activeConversationId]
  );

  const handleThemeChange = useCallback((theme: SlideTheme) => {
    // Map SlideTheme to Tone (they're compatible)
    dispatch({ type: "SET_TONE", tone: theme as Tone });
  }, []);

  const handleEditSlide = useCallback(async () => {
    const msg = makeAssistantMessage(
      "What would you like to change on the current slide? You can:\n\u2022 Change the title\n\u2022 Add, remove, or rewrite bullet points\n\u2022 Restyle the text (font size, color, bold/italic)\n\u2022 Delete the slide\n\nJust describe what you want in natural language!"
    );
    dispatch({ type: "ADD_MESSAGE", message: msg });
    await persistMessage(msg);
    dispatch({ type: "SET_STEP", step: "edit_complete" });
  }, [persistMessage]);

  const handleInsertSlide = async (slide: GeneratedSlide) => {
    // Fetch image data by ID if slide references an image
    let imageData = slide.image; // Use legacy format if present

    if (!imageData && slide.images && slide.images.length > 0) {
      // Fetch image data by ID from Supabase
      const primaryImage = slide.images.find(img => img.role === "primary") || slide.images[0];
      try {
        const { downloadImageAsBase64 } = await import("../services/uploadService");
        const { base64, mimeType } = await downloadImageAsBase64(primaryImage.image_id);
        imageData = {
          fileName: primaryImage.alt_text || "image",
          base64,
          mimeType,
        };
        console.log(`[handleInsertSlide] Fetched image ${primaryImage.image_id} for slide`);
      } catch (error) {
        console.error(`[handleInsertSlide] Failed to fetch image ${primaryImage.image_id}:`, error);
        // Continue without image
      }
    }

    await createSlide({
      title: slide.title,
      bullets: slide.bullets,
      sources: slide.sources,
      theme: state.tone as SlideTheme,
      image: imageData,
      imageLayout: slide.imageLayout,
    });
  };

  const handleInsertAll = async () => {
    for (const slide of slides) {
      // Fetch image data by ID if slide references an image
      let imageData = slide.image; // Use legacy format if present

      if (!imageData && slide.images && slide.images.length > 0) {
        // Fetch image data by ID from Supabase
        const primaryImage = slide.images.find(img => img.role === "primary") || slide.images[0];
        try {
          const { downloadImageAsBase64 } = await import("../services/uploadService");
          const { base64, mimeType } = await downloadImageAsBase64(primaryImage.image_id);
          imageData = {
            fileName: primaryImage.alt_text || "image",
            base64,
            mimeType,
          };
          console.log(`[handleInsertAll] Fetched image ${primaryImage.image_id} for slide`);
        } catch (error) {
          console.error(`[handleInsertAll] Failed to fetch image ${primaryImage.image_id}:`, error);
          // Continue without image
        }
      }

      await createSlide({
        title: slide.title,
        bullets: slide.bullets,
        sources: slide.sources,
        theme: state.tone as SlideTheme,
        image: imageData,
        imageLayout: slide.imageLayout,
      });
    }
  };

  // ── Auth gate ──

  if (authLoading) {
    return (
      <div className={styles.loadingRoot}>
        <Spinner size="medium" label="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (loadingConversations) {
    return (
      <div className={styles.loadingRoot}>
        <Spinner size="medium" label="Loading conversations..." />
      </div>
    );
  }

  const inputDisabled = state.step === "generating" || state.step === "editing" || isTyping;

  return (
    <div className={styles.root}>
      <Header
        logo="assets/logo.png"
        title={props.title}
        user={user}
        onSignOut={signOut}
        isDarkMode={props.isDarkMode}
        onToggleTheme={props.onToggleTheme}
      />
      <ConversationSelector
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
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
      <ChatInput
        onSend={(text) => handleSend(text)}
        onFileUpload={handleFileUpload}
        onImageUpload={handleImageUpload}
        disabled={inputDisabled}
        placeholder={getPlaceholder(state.step)}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        onSummarize={handleSummarize}
        onWebSearch={handleWebSearch}
        isWebSearchActive={isWebSearchMode}
        onDismissWebSearch={handleDismissWebSearch}
        selectedTheme={state.tone as SlideTheme}
        onThemeChange={handleThemeChange}
        onEditSlide={handleEditSlide}
      />
    </div>
  );
};

export default App;
