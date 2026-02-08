import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { indexMessage, indexSlides, retrieveContext, seedConversation } from "./ragStore";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://localhost:3000" }));

// ChatOpenAI for slide generation and summarization (temperature 0.7)
const generateModel = new ChatOpenAI({ model: "gpt-4o", temperature: 0.7 });

// ChatOpenAI for edits (lower temperature for precision)
const editModel = new ChatOpenAI({ model: "gpt-4o", temperature: 0.3 });

type Mode = "generate" | "summarize" | "compare" | "proscons" | "research";

// Helper to convert conversation history to LangChain message types
function toLangChainMessages(
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }> | undefined,
  userMessage: string,
  ragContext?: string[]
): BaseMessage[] {
  let augmentedPrompt = systemPrompt;
  if (ragContext && ragContext.length > 0) {
    augmentedPrompt += `\n\n--- RELEVANT CONVERSATION CONTEXT ---\nThe following are relevant excerpts from earlier in this conversation. Use them to maintain context awareness:\n${ragContext.join("\n\n")}\n--- END CONTEXT ---`;
  }

  const messages: BaseMessage[] = [new SystemMessage(augmentedPrompt)];
  if (history?.length) {
    for (const msg of history) {
      messages.push(msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content));
    }
  }
  messages.push(new HumanMessage(userMessage));
  return messages;
}

const systemPrompts: Record<Mode, string> = {
  generate:
    "You are a presentation expert. Create slides with specific, valuable information - not generic statements. Each slide must contain concrete facts, actionable insights, or specific examples. Use clear titles and 3-5 concise, informative bullet points. Avoid meta-commentary or process descriptions.",
  summarize:
    "You are a summarization expert. Extract the most important facts, insights, and takeaways from the content. Focus on specific information, key findings, and concrete details. Avoid generic summaries - be specific and informative.",
  compare:
    "You are an analysis expert. Create detailed comparisons with specific differences, concrete examples, and quantifiable metrics where possible. Include factual distinctions, real-world implications, and data-driven insights. Avoid vague comparisons.",
  proscons:
    "You are a critical thinking expert. Provide specific, concrete pros and cons with real examples and evidence. Include factual benefits and drawbacks, not generic observations. Support claims with specifics.",
  research:
    "You are a research expert. Extract ONLY information that appears in the provided research sources - do NOT use general knowledge. Focus on CURRENT, SPECIFIC events: exact dates (e.g., 'On Feb 5, 2026...'), recent developments, specific people/places, breaking news, statistics with numbers, and concrete events from the sources. You may use shorthand citations like 'According to [source name]...' or 'Reuters reports...' in bullet points. Prioritize the most recent and newsworthy information. Avoid generic background - focus on what's happening NOW based on the sources.",
};

app.post("/api/generate", async (req, res) => {
  const { input, mode, slideCount, tone, additionalContext, conversationHistory, conversationId } = req.body as {
    input: string;
    mode: Mode;
    slideCount: number;
    tone: string;
    additionalContext?: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    conversationId?: string;
  };

  if (!input || !mode) {
    res.status(400).json({ error: "input and mode are required" });
    return;
  }

  const hasResearchSources = additionalContext?.includes("RESEARCH SOURCES:");

  console.log("Generate request - Mode:", mode, "Has research sources:", hasResearchSources);

  let jsonFormat = `{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"] }] }`;
  let citationInstructions = "";

  if (hasResearchSources && mode === "research") {
    console.log("Including sources in JSON format");
    jsonFormat = `{ "slides": [{ "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"], "sources": ["https://example.com/article", "https://news.site.com/story"] }] }`;
    citationInstructions = "\n\nIMPORTANT: For each slide that uses information from the research sources, include a 'sources' array with the FULL URLs of the sources used (e.g., ['https://www.nytimes.com/article', 'https://www.reuters.com/news']). Include complete URLs with https:// protocol. If a slide doesn't use any research sources, omit the 'sources' field or set it to an empty array.";
  }

  const systemPrompt = `${systemPrompts[mode]}${citationInstructions}

Respond ONLY with valid JSON in this exact format:
${jsonFormat}

Generate exactly ${slideCount || 3} slides. Use a ${tone || "professional"} tone. Do not include any text outside the JSON.`;

  let userMessage = input;
  if (additionalContext) {
    userMessage += `\n\nAdditional context: ${additionalContext}`;
  }

  // RAG: Seed store if needed, index user message, retrieve relevant context
  let ragContext: string[] = [];
  if (conversationId) {
    if (conversationHistory?.length) {
      await seedConversation(conversationId, conversationHistory);
    }
    await indexMessage(conversationId, "user", userMessage);
    ragContext = await retrieveContext(conversationId, userMessage, 5);
    console.log(`[RAG] Retrieved ${ragContext.length} context chunks for generate`);
  }

  const langchainMessages = toLangChainMessages(systemPrompt, conversationHistory?.slice(-4), userMessage, ragContext);

  try {
    const response = await generateModel.invoke(langchainMessages);
    const content = typeof response.content === "string" ? response.content : "";

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("Generated slides:", JSON.stringify(parsed, null, 2));

    // RAG: Index the generated slides for future retrieval
    if (conversationId && parsed.slides) {
      const slidesSummary = parsed.slides
        .map((s: any, i: number) => `Slide ${i + 1}: ${s.title} - ${s.bullets.join("; ")}`)
        .join("\n");
      await indexSlides(conversationId, parsed.slides);
      await indexMessage(conversationId, "assistant", slidesSummary, { type: "slide_summary" });
    }

    res.json(parsed);
  } catch (error: unknown) {
    console.error("LangChain error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/api/summarize", async (req, res) => {
  const { input, scope } = req.body as { input: string; scope: string };

  if (!input) {
    res.status(400).json({ error: "input is required" });
    return;
  }

  const systemPrompt =
    scope === "current_slide"
      ? "You are a summarization expert. The user will provide the text content of a single presentation slide. Write a clear, concise summary of the slide in 2-3 sentences. Respond with plain text only, no JSON or markdown formatting."
      : "You are a summarization expert. The user will provide the text content of an entire presentation. Write a clear, concise summary of the whole presentation in a short paragraph (4-6 sentences). Respond with plain text only, no JSON or markdown formatting.";

  try {
    const response = await generateModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(input),
    ]);

    const content = typeof response.content === "string" ? response.content : "";
    res.json({ summary: content.trim() });
  } catch (error: unknown) {
    console.error("LangChain error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/api/search", async (req, res) => {
  const { query, maxResults = 8, slideCount = 3 } = req.body as {
    query: string;
    maxResults?: number;
    slideCount?: number;
  };

  if (!query) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  if (!process.env.TAVILY_API_KEY) {
    res.status(500).json({ error: "Tavily API not configured. Please set TAVILY_API_KEY in .env file." });
    return;
  }

  // Detect if this is a current events/news query
  const lowerQuery = query.toLowerCase();
  const isCurrentEvents = /\b(latest|recent|current|today|news|2024|2025|2026|breaking|developments)\b/i.test(lowerQuery);

  // For current events, enhance query to get specific news articles (not category pages)
  // Add specific terms that encourage article-level results
  const searchQuery = isCurrentEvents
    ? `${query} latest news articles analysis 2025 2026`
    : query;

  console.log(`[Tavily] Searching for: "${searchQuery}" (max ${maxResults} results, slides: ${slideCount}, current events: ${isCurrentEvents})`);

  try {
    // Create a per-request TavilySearch instance to support dynamic maxResults
    const searchTool = new TavilySearch({
      maxResults: maxResults,
      searchDepth: "advanced",
      includeAnswer: false,
      includeRawContent: false,
    });

    const rawResults = await searchTool.invoke({ query: searchQuery });

    // TavilySearch returns a JSON string; parse it defensively
    const parsedResults = typeof rawResults === "string" ? JSON.parse(rawResults) : rawResults;
    const resultArray = Array.isArray(parsedResults) ? parsedResults : (parsedResults.results || []);

    console.log(`[Tavily] Found ${resultArray.length} results`);

    const results = resultArray.map((r: { title: string; url: string; content: string }) => {
      console.log(`[Tavily] Result URL: ${r.url}`);

      return {
        title: r.title,
        url: r.url,
        snippet: r.content,
        source: r.url,
      };
    });

    res.json({ results });
  } catch (error: unknown) {
    console.error("[Tavily] Search error:", error);

    if (error instanceof Error) {
      console.error("[Tavily] Error message:", error.message);
      console.error("[Tavily] Error stack:", error.stack);
    }

    const message = error instanceof Error ? error.message : "Search failed";
    res.status(500).json({ error: `Tavily search failed: ${message}` });
  }
});

app.post("/api/fetch-article", async (req, res) => {
  const { url } = req.body as { url: string };

  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  console.log(`[Article Fetch] Fetching from: ${url}`);

  try {
    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SliderBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Basic HTML to text conversion (remove tags, get text content)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove styles
      .replace(/<[^>]+>/g, " ") // Remove HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    console.log(`[Article Fetch] Successfully fetched ${textContent.length} characters`);

    res.json({
      url: url,
      content: textContent,
      length: textContent.length,
    });
  } catch (error: unknown) {
    console.error("[Article Fetch] Error:", error);

    if (error instanceof Error) {
      console.error("[Article Fetch] Error message:", error.message);
    }

    const message = error instanceof Error ? error.message : "Article fetch failed";
    res.status(500).json({ error: `Failed to fetch article: ${message}` });
  }
});

app.post("/api/edit", async (req, res) => {
  const { slideContent, editRequest, conversationHistory, conversationId } = req.body as {
    slideContent: {
      shapes: Array<{
        index: number;
        name: string;
        text: string;
        role: string;
      }>;
    };
    editRequest: string;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    conversationId?: string;
  };

  if (!slideContent || !editRequest) {
    res.status(400).json({ error: "slideContent and editRequest are required" });
    return;
  }

  console.log("[Edit] Request:", editRequest);

  const systemPrompt = `You are a PowerPoint slide editing assistant. The user wants to modify an existing slide.

You will receive the current slide content (shapes with their roles and text) and the user's edit request.

Respond ONLY with valid JSON containing edit instructions. Available operations:

- "change_title": Change the title text. Requires "newText".
- "replace_content": Replace the entire content/body text. Requires "newText" with bullet points formatted as "• Point 1\\n• Point 2".
- "add_bullets": Add new bullet points. Requires "bulletsToAdd" (array of strings, WITHOUT the bullet character).
- "remove_bullets": Remove bullet points matching text. Requires "bulletsToRemove" (array of partial text matches to identify which bullets to remove).
- "restyle": Change visual styling. Requires "target" ("title", "content", or "all") and "style" object with optional: fontSize (number), fontColor (hex string like "#FF0000"), bold (boolean), italic (boolean), backgroundColor (hex string).
- "rewrite": AI-rewrite of content while keeping the same meaning. Requires "target" ("title" or "content") and "newText". For content, format as "• Point 1\\n• Point 2".
- "delete_slide": Delete the entire slide. No additional fields needed.

Respond ONLY with valid JSON in this format:
{
  "instructions": [
    { "operation": "change_title", "newText": "New Title Here" }
  ],
  "summary": "Brief description of what was changed"
}

You may include multiple instructions for complex edits. Do not include any text outside the JSON.`;

  // Build user message with slide context
  let slideDescription = "Current slide content:\n";
  for (const shape of slideContent.shapes) {
    if (shape.text) {
      slideDescription += `- [${shape.role}] "${shape.text}"\n`;
    }
  }
  slideDescription += `\nUser's edit request: ${editRequest}`;

  // RAG: Index edit request and retrieve relevant context
  let ragContext: string[] = [];
  if (conversationId) {
    await indexMessage(conversationId, "user", editRequest);
    ragContext = await retrieveContext(conversationId, editRequest, 3);
    console.log(`[RAG] Retrieved ${ragContext.length} context chunks for edit`);
  }

  const langchainMessages = toLangChainMessages(
    systemPrompt,
    conversationHistory?.slice(-4),
    slideDescription,
    ragContext
  );

  try {
    const response = await editModel.invoke(langchainMessages);
    const content = typeof response.content === "string" ? response.content : "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse AI edit response" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("[Edit] Generated instructions:", JSON.stringify(parsed, null, 2));

    // RAG: Index the edit result
    if (conversationId && parsed.summary) {
      await indexMessage(conversationId, "assistant", `Edit applied: ${parsed.summary}`, { type: "edit" });
    }

    res.json(parsed);
  } catch (error: unknown) {
    console.error("[Edit] LangChain error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// RAG: Seed a conversation with historical messages
app.post("/api/rag/seed", async (req, res) => {
  const { conversationId, messages } = req.body as {
    conversationId: string;
    messages: Array<{ role: string; content: string }>;
  };

  if (!conversationId || !messages?.length) {
    res.status(400).json({ error: "conversationId and messages are required" });
    return;
  }

  try {
    await seedConversation(conversationId, messages);
    console.log(`[RAG] Seeded conversation ${conversationId} with ${messages.length} messages`);
    res.json({ success: true, indexed: messages.length });
  } catch (error: unknown) {
    console.error("[RAG] Seed error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Spark API server running on http://localhost:${PORT}`);
});
