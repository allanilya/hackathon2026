import * as React from "react";
import { useReducer, useState, useEffect, useCallback, useRef } from "react";
import Header from "./Header";
import ChatContainer from "./ChatContainer";
import ChatInput from "./ChatInput";
import ConversationSelector from "./ConversationSelector";
import AuthScreen from "./AuthScreen";
import { Button, makeStyles, tokens, Spinner } from "@fluentui/react-components";
import { ArrowReset24Regular, SignOut20Regular } from "@fluentui/react-icons";
import { createSlide } from "../taskpane";
import { useSlideDetection } from "../hooks/useSlideDetection";
import { getSlideContent, getAllSlidesContent } from "../services/slideService";
import { questions } from "../questions";
import { parseUserIntent } from "../utils/intentParser";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchConversations,
  fetchMessages,
  createConversation,
  updateConversation,
  saveMessage,
} from "../services/conversationService";
import type { ConversationState, ConversationStep, ChatMessage, ChatOption, GeneratedSlide, Mode, Tone, SearchResult, Conversation } from "../types";

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
  loadingRoot: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  signOutRow: {
    display: "flex",
    justifyContent: "flex-end",
    paddingRight: "12px",
    paddingTop: "4px",
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

function makeAssistantMessage(text: string, options?: ChatOption[], allowOther?: boolean, searchResults?: SearchResult[]): ChatMessage {
  return { id: generateId(), role: "assistant", text, options, allowOther, searchResults, timestamp: Date.now() };
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
    case "web_search_query":
      return "What would you like to search for?";
    case "web_search_results":
      return "Searching...";
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
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Multi-conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");

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
        const convs = await fetchConversations(user.id);

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
          };
          await createConversation(user.id, newConv);
          setConversations([newConv]);
          setActiveConversationId(id);
          dispatch({ type: "RESET" });
          setSlides([]);
          setSelectedValues({});

          // Show greeting
          const greeting = makeAssistantMessage(
            "Hi! I'm Spark. Tell me what you'd like to create a presentation about."
          );
          dispatch({ type: "ADD_MESSAGE", message: greeting });
          await saveMessage(id, greeting).catch(() => {});
        } else {
          // Load the most recent conversation fully
          const latest = convs[0];
          const messages = await fetchMessages(latest.id);
          latest.state.messages = messages;

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
            messages.forEach((msg) => {
              dispatch({ type: "ADD_MESSAGE", message: msg });
            });

            // If the latest conversation has no messages, show greeting
            if (messages.length === 0) {
              const greeting = makeAssistantMessage(
                "Hi! I'm Spark. Tell me what you'd like to create a presentation about."
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
          "Hi! I'm Spark. Tell me what you'd like to create a presentation about."
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
      messages.forEach((msg) => {
        dispatch({ type: "ADD_MESSAGE", message: msg });
      });
      setTimeout(() => { isRestoringRef.current = false; }, 100);
    }, 0);
  }, [conversations, activeConversationId]);

  const handleNewConversation = useCallback(async () => {
    const id = generateConvId();
    const newConv: Conversation = {
      id,
      title: "New Chat",
      state: initialState,
      slides: [],
      selectedValues: {},
      createdAt: Date.now(),
    };

    // Save to Supabase
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
        "Hi! I'm Spark. Tell me what you'd like to create a presentation about."
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
    (message: ChatMessage) => {
      if (user && activeConversationId) {
        saveMessage(activeConversationId, message).catch((err) =>
          console.error("Failed to save message:", err)
        );
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
        persistMessage(msg);
      }
    },
    [persistMessage]
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

    const genMsg = makeAssistantMessage(
      state.mode === "research" ? "Creating slides from research..." : "Perfect! Generating your slides now..."
    );
    dispatch({ type: "ADD_MESSAGE", message: genMsg });
    persistMessage(genMsg);

    try {
      const response = await fetch("/api/generate", {
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
      persistMessage(doneMsg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate slides";
      const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      persistMessage(errorMsg);
      dispatch({ type: "SET_STEP", step: "anything_else" });
    } finally {
      setIsTyping(false);
    }
  }, [state.userPrompt, state.mode, state.slideCount, state.tone, state.additionalContext, persistMessage]);

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
    persistMessage(askMsg);
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
    persistMessage(genMsg);

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
      persistMessage(summaryMsg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate summary";
      const errorMsg = makeAssistantMessage(`Sorry, something went wrong: ${message}. Please try again.`);
      dispatch({ type: "ADD_MESSAGE", message: errorMsg });
      persistMessage(errorMsg);
      dispatch({ type: "SET_STEP", step: "initial" });
    } finally {
      setIsTyping(false);
    }
  }, [persistMessage]);

  const runWebSearch = useCallback(async (query: string) => {
    dispatch({ type: "SET_STEP", step: "web_search_results" });
    setIsTyping(true);

    // Parse user intent to extract preferences from the query
    const intent = parseUserIntent(query);
    const slideCount = intent.slideCount !== undefined ? intent.slideCount : 3;
    const tone = intent.tone || "professional";
    const mode = intent.mode || "research";
    const topic = intent.topic || query;

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
            maxResults: 5,
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

      const genResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: topic,
          mode,
          slideCount,
          tone,
          additionalContext: searchContext ? `RESEARCH SOURCES:\n${searchContext}` : "",
        }),
      });

      if (!genResponse.ok) {
        const errBody = await genResponse.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error (${genResponse.status})`);
      }

      const genData = await genResponse.json();
      setSlides(genData.slides || []);
      dispatch({ type: "SET_STEP", step: "complete" });

      const doneMsg = makeAssistantMessage(
        `Here are your ${genData.slides?.length || 0} slides! You can insert them individually or all at once into your presentation.`
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
  }, []);

  const handleSend = useCallback(
    async (text: string, option?: ChatOption) => {
      // Add user message
      const userMsg = makeUserMessage(text);
      dispatch({ type: "ADD_MESSAGE", message: userMsg });
      persistMessage(userMsg);

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
              persistMessage(msg);
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

        case "web_search_query": {
          await runWebSearch(text);
          break;
        }

        default:
          break;
      }
    },
    [state.step, advanceConversation, generateSlides, runSummarize, runWebSearch, persistMessage]
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
        persistMessage(userMsg);
        dispatch({ type: "SET_USER_PROMPT", prompt: extractedText });
        await advanceConversation("initial");
      } else if (state.step === "anything_else") {
        const userMsg = makeUserMessage(`Uploaded: ${fileName}`);
        dispatch({ type: "ADD_MESSAGE", message: userMsg });
        persistMessage(userMsg);
        dispatch({ type: "SET_ADDITIONAL_CONTEXT", text: extractedText });
        dispatch({ type: "SET_STEP", step: "generating" });
        await delay(300);
        await generateSlides();
      }
    },
    [state.step, advanceConversation, generateSlides, persistMessage]
  );

  const handleReset = useCallback(() => {
    handleNewConversation();
  }, [handleNewConversation]);

  const handleInsertSlide = async (slide: GeneratedSlide) => {
    await createSlide({ title: slide.title, bullets: slide.bullets });
  };

  const handleInsertAll = async () => {
    for (const slide of slides) {
      await createSlide({ title: slide.title, bullets: slide.bullets });
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

  const inputDisabled = state.step === "generating" || isTyping;

  return (
    <div className={styles.root}>
      <Header logo="assets/logo-filled.png" title={props.title} />
      <div className={styles.signOutRow}>
        <Button
          appearance="subtle"
          icon={<SignOut20Regular />}
          onClick={signOut}
          size="small"
        >
          Sign Out
        </Button>
      </div>
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
        onWebSearch={handleWebSearch}
        isWebSearchActive={isWebSearchMode}
        onDismissWebSearch={handleDismissWebSearch}
      />
    </div>
  );
};

export default App;
